import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import {
  DeepPartial,
  FindOneOptions,
  FindOptionsWhere,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import {
  AccessTokenData,
  ORGANISATION_KEY,
} from '../constants/authorization.constants';
import {
  AuthOutput,
  CreateOrganisationInput,
  InviteStatus,
  OrganisationOrigin,
  UpdateOrganisationInput,
  UpdateOrganisationMfaInput,
  UserOrganisationStatus,
} from '../../../customer-interface/schema/graphql.schema';
import Organisation from '../entity/organisation.entity';
import { Industry } from '../constants/onboarding.constants';
import { EnableLog } from '../logging.decorator';
import { ChargebeeService } from '../../subscription/service/chargebee.service';
import { updateCustomerInput } from '../../subscription/constants/subscription.constants';
import { BaseService } from 'src/common/utils/base.service';
import { OrganisationMultiFactorAuthService } from './organisationMultiFactorAuth.service';
import OrganisationMultiFactorAuth from '../entity/organisation.multiFactorAuth.entity';
import UserOrganisationService from './user.organisation.service';
import UserService from './user.service';
import UserGroup from '../entity/userGroup.entity';
import { GroupService } from './group.service';
import { AuthorizationMixpanelService } from '../../mixpanel/service/authorization.mixpanel.service';
import CountryService from './country.service';
import { RedisCacheService } from '../../../common/cache/redis-cache/redis-cache.service';
import { CustomTransactional } from '../../../common/decorator/custom.transactional';

@Injectable()
export default class OrganisationService extends BaseService<Organisation> {
  constructor(
    @InjectRepository(Organisation)
    private organisationRepository: Repository<Organisation>,
    private chargeBeeService: ChargebeeService,
    private organisationMultiFactorAuthService: OrganisationMultiFactorAuthService,
    @Inject(forwardRef(() => UserOrganisationService))
    private userOrganisationService: UserOrganisationService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private groupService: GroupService,
    private authorizationMixpanelService: AuthorizationMixpanelService,
    private countryService: CountryService,
    private cacheService: RedisCacheService,
  ) {
    super(organisationRepository);
  }

  async getOrganisationFromCache(
    organisationId: string,
  ): Promise<Organisation> {
    const data: Organisation | undefined = await this.cacheService.get(
      `${ORGANISATION_KEY}${organisationId}`,
    );
    if (data) return data;
    const organisation = await this.findOneOrFail({
      where: {
        id: organisationId,
      },
      select: ['id', 'name'],
    });
    await this.setOrganisationFromCache(organisationId, organisation);
    return organisation;
  }

  async setOrganisationFromCache(
    organisationId: string,
    organisation: Organisation,
  ) {
    await this.cacheService.set(
      `${ORGANISATION_KEY}${organisationId}`,
      organisation,
    );
  }

  /**
   * To get organisation by their id's
   * @param organisationIds
   * @returns List of Organisation
   */
  async getOrganisationsByIds(
    organisationIds: string[],
  ): Promise<Organisation[]> {
    return await this.organisationRepository.findBy({
      id: In(organisationIds),
    });
  }

  /**
   * Finds one organisation using the given conditions.
   * Throws the given error message if not found.
   * @param queryObj query object to  find organisation
   * @param errorMessage message to throw in error
   * @returns Organisation
   */
  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<Organisation> | string,
    errorMessage?: string,
  ): Promise<Organisation> {
    return await super.findOneOrFail(query, errorMessage);
  }

  /**
   * Finds user's organisation
   * @param user user access token data
   * @returns Organisation
   */
  @EnableLog()
  async getOrganisation(user: AccessTokenData): Promise<Organisation> {
    const organisation = await this.findOneOrFail({
      where: { id: user.organisation.id },
    });
    return organisation;
  }

  /**
   * To create an organisation
   * @param user
   * @param input
   * @returns
   */
  @Transactional()
  @CustomTransactional()
  @EnableLog()
  async createOrganisation(
    user: AccessTokenData,
    input: CreateOrganisationInput,
    response: Response,
  ): Promise<{ auth: AuthOutput | undefined; organisation: Organisation }> {
    const [userObj, country] = await Promise.all([
      this.userService.findOneOrFail({
        where: { id: user.id },
      }),
      ...(input.countryId
        ? [this.countryService.findOneOrFail({ id: input.countryId })]
        : []),
    ]);
    const organisationObj: DeepPartial<Organisation> = {
      name: input.name,
      origin: OrganisationOrigin.Signup,
      createdById: user.id,
      email: userObj.email,
      ...(input.countryId && { countryId: input.countryId }),
      ...(input.industry && { industry: input.industry }),
      ...(input.employeeCount != undefined && {
        employeeCount: parseInt(input.employeeCount),
      }),
      ...(input.monthlyContractCount != undefined && {
        monthlyContractCount: parseInt(input.monthlyContractCount),
      }),
    };
    const organisation = await this.organisationRepository.save(
      organisationObj,
    );
    const userOrganisation =
      await this.userOrganisationService.saveUserOrganisation({
        organisationId: organisation.id,
        userId: user.id,
        ...(input.role && { role: input.role }),
        inviteStatus: InviteStatus.Accepted,
        status: UserOrganisationStatus.Active,
      });
    const defaultGroup = await this.userService.getDefalutCustomergroup();
    if (defaultGroup) {
      const userGroup = [
        {
          userId: user.id,
          groupId: defaultGroup.id,
          organisationId: organisation.id,
        } as UserGroup,
      ];
      await this.groupService.createUserGroup(userGroup);
    }
    // Fire this event only once during user onboarding.
    // When creating multiple organization flow exists,
    // this event should be fired by a boolean variable isOnboarding
    await this.authorizationMixpanelService.trackOnboarding({
      ...organisation,
      ...(country && { countryName: country.name }),
      role: input.role,
    });
    return {
      auth: input.switchOrganisation
        ? await this.userService.switchOrganisation(
            { userOrgId: userOrganisation.id },
            user,
            response,
          )
        : undefined,
      organisation,
    };
  }

  /**
   * Update user's organisation details
   * @param user user access token data
   * @param input organisation details input
   * @returns Updated organisation details
   */
  @Transactional()
  @EnableLog()
  async updateOrganisation(
    user: AccessTokenData,
    input: UpdateOrganisationInput,
  ): Promise<Organisation> {
    let organisation = await this.findOneOrFail({
      where: { id: user.organisation.id },
    });
    input.email = input.email || undefined;
    const customerDetails: updateCustomerInput = {
      company: input.name,
      email: input.email,
    };
    (input.email != organisation.email || input.name != organisation.name) &&
      input.email !== undefined &&
      (await this.chargeBeeService.updateCustomer(
        user.organisation.id,
        customerDetails,
      ));
    organisation.name = input.name;
    input.email && (organisation.email = input.email);
    input.industry && (organisation.industry = input.industry);
    input.uenNumber != null && (organisation.uenNumber = input.uenNumber);
    input.countryId && (organisation.countryId = input.countryId);
    input.employeeCount != undefined &&
      (organisation.employeeCount = parseInt(input.employeeCount));
    input.monthlyContractCount != undefined &&
      (organisation.monthlyContractCount = parseInt(
        input.monthlyContractCount,
      ));
    organisation = await this.organisationRepository.save(organisation);
    if (input.role) {
      const userOrg = await this.userOrganisationService.findOneOrFail({
        where: { userId: user.id, organisationId: organisation.id },
      });
      userOrg.role = input.role;
      await this.userOrganisationService.saveUserOrganisation(userOrg);
    }
    return organisation;
  }

  /**
   * Get organisation by given condition.
   * @param where Condition against organisation table
   * @param relations
   * @returns organisation object or undefined
   */
  async getOrganisationByCondition(
    where: FindOptionsWhere<Organisation>,
    relations?: string[],
  ): Promise<Organisation | null> {
    return this.organisationRepository.findOne({
      where,
      relations,
    });
  }

  /**
   * @returns All the possible values for organisation-industry.
   */
  getIndustries() {
    return Object.values(Industry);
  }

  /**
   * To update a organisation
   * @param id
   * @param set
   */
  async update(id: string, set: ObjectLiteral) {
    return this.organisationRepository.update({ id }, set);
  }

  /**
   * Enable/Disable 2FA for the organisation
   * @param user user access token data
   * @param input organisation MFA details
   * @returns Updated organisation MFA record
   */
  @Transactional()
  @EnableLog()
  async updateOrganisationMfa(
    user: AccessTokenData,
    input: UpdateOrganisationMfaInput,
  ): Promise<OrganisationMultiFactorAuth> {
    let organisationMfa:
      | OrganisationMultiFactorAuth
      | DeepPartial<OrganisationMultiFactorAuth>
      | null = await this.organisationMultiFactorAuthService.findOne({
      where: { organisationId: user.organisation.id },
    });
    if (organisationMfa) {
      organisationMfa.isMfaEnabled = input.isMfaEnabled;
    } else {
      organisationMfa = {
        isMfaEnabled: input.isMfaEnabled,
        organisationId: user.organisation.id,
      };
    }
    return await this.organisationMultiFactorAuthService.save(organisationMfa);
  }

  /**
   * Get Organisation 2FA Status
   * @param organisationId Organisation ID
   * @returns isMfaEnabled field if found
   */
  @Transactional()
  @EnableLog()
  async getMfaStatus(organisationId: string): Promise<boolean | undefined> {
    const organisationMfa: OrganisationMultiFactorAuth | null =
      await this.organisationMultiFactorAuthService.findOne({
        where: { organisationId },
      });
    if (organisationMfa?.isMfaEnabled) return true;
  }
}
