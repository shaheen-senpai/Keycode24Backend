import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import {
  GeneralApplicationException,
  generalError,
} from '../../../common/exception/general.application.exception';
import UserOrganisation from '../entity/user.organisation.entity';
import { BaseService } from '../../../common/utils/base.service';
import { Transactional } from 'typeorm-transactional';
import { EnableLog } from '../logging.decorator';
import {
  ActivateUserOrganisationInput,
  DeleteUserOrganisationInput,
  StatusResponse,
  UserOrganisationStatus,
} from '../../../customer-interface/schema/graphql.schema';
import { AccessTokenData } from '../constants/authorization.constants';
import UserService from './user.service';
import { SubscriptionService } from '../../../core/subscription/service/subscription.service';
import UserCacheService from './usercache.service';
import { GroupService } from './group.service';
import { ShareService } from '../../share/service/share.service';

@Injectable()
export default class UserOrganisationService extends BaseService<UserOrganisation> {
  constructor(
    @InjectRepository(UserOrganisation)
    private userOrgRepository: Repository<UserOrganisation>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => UserCacheService))
    private userCacheService: UserCacheService,
    private groupService: GroupService,
    @Inject(forwardRef(() => ShareService))
    private shareService: ShareService,
  ) {
    super(userOrgRepository);
  }
  /**
   * Finds one userOrganisation using the given conditions.
   * Throws the given error message if not found.
   * @param queryObj query object to  find userOrganisation
   * @param errorMessage message to throw in error
   * @returns userOrganisation
   */
  async findOneOrFail(
    queryObj: ObjectLiteral | FindOneOptions<UserOrganisation> | string,
    errorMessage = 'User Organisation not found',
  ): Promise<UserOrganisation> {
    typeof queryObj === 'string' && (queryObj = { where: { id: queryObj } });
    !Object.keys(queryObj).includes('where') &&
      (queryObj = { where: queryObj });
    const organisation = await this.userOrgRepository.findOne(queryObj);
    if (!organisation) throw new GeneralApplicationException(errorMessage);
    return organisation;
  }

  /**
   * To find User Organisations using given condition
   * @param input
   * @returns List of User Organisation
   */
  async find(
    input: string[] | FindManyOptions<UserOrganisation> | ObjectLiteral,
  ): Promise<UserOrganisation[]> {
    return await super.find(input);
  }

  /**
   * find users by the organization id, user id and status
   * @param organisationId
   * @param userIds
   */
  async findOrganisationUsers(
    organisationId: string,
    userIds: string[],
  ): Promise<UserOrganisation[]> {
    return await this.find({
      where: {
        userId: In(userIds),
        organisationId: organisationId,
        status: UserOrganisationStatus.Active,
      },
    });
  }
  /**
   * To save User Organisation
   * @param userOrgObj
   * @returns UserOrganisation
   */
  async saveUserOrganisation(userOrgObj: DeepPartial<UserOrganisation>) {
    const savedUserOrg = await this.userOrgRepository.save(userOrgObj);
    return savedUserOrg;
  }

  /**
   * To update UserOrganisation Status to Active
   * @param input
   * @param user
   * @returns UserOrganisation
   */
  @Transactional()
  @EnableLog()
  async activateUserOrganisation(
    input: ActivateUserOrganisationInput,
    user: AccessTokenData,
  ): Promise<UserOrganisation> {
    const userOrganisation = await this.userOrgRepository.findOneBy({
      userId: input.userId,
      organisationId: user.organisation.id,
    });
    if (userOrganisation) {
      if (input.activate) {
        const userCount = await this.userService.getOrgUserCount(
          user.organisation.id,
        );
        const subscription =
          await this.subscriptionService.getCurrentSubscriptionInfo(
            user.organisation.id,
          );
        const maxAllowedUserCount: number = subscription.userCount;
        if (userCount + 1 > maxAllowedUserCount) {
          generalError(
            `Cannot activate user! Please upgrade your subscription or inactivate 1 user.`,
          );
        }
        userOrganisation.status = UserOrganisationStatus.Active;
      } else {
        const noActiveOwners = await this.userService.checkActiveOwners(
          user.organisation.id,
          input.userId,
        );
        noActiveOwners &&
          generalError(
            'At least one active owner should exist in an organisation',
          );
        userOrganisation.status = UserOrganisationStatus.Inactive;
        // Removing users's group cache. Next time when user try a request,
        // authorisation guard will also check for user organisation status
        await this.userCacheService.invalidateUserGroupsCache(
          userOrganisation.userId,
        );
      }
    } else generalError('The User is not found in this organisation');
    const savedUserOrg = await this.userOrgRepository.save(userOrganisation);
    return savedUserOrg;
  }

  /**
   * Function to delete userOrganisation(Removing user from organisation)
   * @param  where find conditions against UserOrganisation table
   * @returns Boolean
   */
  @Transactional()
  @EnableLog()
  public async deleteUserOrganisation(
    input: DeleteUserOrganisationInput,
    user: AccessTokenData,
  ): Promise<StatusResponse> {
    await this.shareService.deleteEmptyContractShares({
      toUserId: input.userId,
      orgId: user.organisation.id,
    });
    const result = await this.userOrgRepository.softDelete({
      userId: input.userId,
      organisationId: user.organisation.id,
    });
    result.affected === 0 && generalError('User not found in organisation');
    if (input.assignToId) {
      await this.findOneOrFail(
        {
          organisationId: user.organisation.id,
          userId: input.assignToId,
        },
        'User Not Found In Organisation',
      );
      await this.userService.assignUserAssets(
        user.organisation.id,
        input.userId,
        input.assignToId,
      );
    }
    await this.userCacheService.invalidateUserGroupsCache(input.userId);
    await this.groupService.deleteUserGroups(
      input.userId,
      user.organisation.id,
    );
    return { message: 'User Removed Successfully' };
  }
}
