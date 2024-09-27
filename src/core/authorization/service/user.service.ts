import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import { Response } from 'express';
import {
  Brackets,
  Connection,
  EntityManager,
  FindOptionsWhere,
  FindOneOptions,
  In,
  ObjectLiteral,
  Repository,
  FindManyOptions,
  FindOptionsSelect,
} from 'typeorm';
import User from '../entity/user.entity';
import {
  CreateUserWithRoleInput,
  StatusResponse,
  EditUserRolesInput,
  GetUsersFilterInput,
  InviteStatus,
  OperationType,
  OrganisationOrigin,
  PlanDetail,
  SubscriptionStatus,
  SwitchOrganisationInput,
  UpdateUserGroupInput,
  UpdateUserInput,
  UpdateUserPermissionInput,
  UserOrigin,
  UserType,
  OrganisationSubscription,
  UserOrganisationStatus,
  LinkedAccountType,
  AuthOutput,
  UserAsset,
  UserAssetCountObject,
} from '../../../customer-interface/schema/graphql.schema';
import Group from '../entity/group.entity';
import GroupPermission from '../entity/groupPermission.entity';
import Permission from '../entity/permission.entity';
import UserGroup from '../entity/userGroup.entity';
import UserPermission from '../entity/userPermission.entity';
import { GroupNotFoundException } from '../exception/group.exception';
import { PermissionNotFoundException } from '../exception/permission.exception';
import { UserNotFoundException } from '../exception/user.exception';
import GroupCacheService from './groupcache.service';
import PermissionCacheService from './permissioncache.service';
import UserCacheService from './usercache.service';
import Organisation from '../entity/organisation.entity';
import UserOrganisation from '../entity/user.organisation.entity';
import {
  AccessTokenData,
  CustomerGroupType,
  DefaultCustomerPermissions,
  PermissionsType,
  USER_KEY,
} from '../constants/authorization.constants';
import { AuthenticationHelper } from '../../authentication/authentication.helper';
import { getPaginationMetaData } from '../../../common/utils/general.utils';
import { ConfigService } from '@nestjs/config';
import OrganisationService from './organisation.service';
import { UserLinkedAccountsService } from './userLinkedAccounts.service';
import { EnableLog } from '../logging.decorator';
import { SubscriptionService } from '../../subscription/service/subscription.service';
import { GroupService } from './group.service';
import UserOrganisationService from './user.organisation.service';
import { PermissionService } from './permission.service';
import { AuthBlockchainService } from '../../../blockchain/service/auth.blockchain';
import { RedisCacheService } from '../../../common/cache/redis-cache/redis-cache.service';
import {
  GeneralApplicationException,
  generalError,
} from '../../../common/exception/general.application.exception';
import {
  UserOrganisationInviteTokenClaims,
  TokenType,
  UpdatePasswordTokenClaims,
  ResetMfaTokenClaims,
  TotpTokenClaims,
  LoginResponseCode,
  FAILED_OTPLOGIN_ATTEMPTS,
  MAX_FAILED_OTP_ATTEMPTS,
} from '../../authentication/constants/authentication.constants';
import UserauthService from '../../authentication/service/userauth.service';
import { UserMailService } from '../../email/service/user.mail.service';
import PlanItem from '../../subscription/entity/plan.item.entity';
import PlanItemPermission from '../../subscription/entity/plan.item.permission.entity';
import { PlanItemService } from '../../subscription/service/plan.item.service';
import { LinkedAccountPlatform } from '../../../admin-interface/schema/graphql.schema';
import { BaseService } from 'src/common/utils/base.service';
import { OrganisationMultiFactorAuthService } from './organisationMultiFactorAuth.service';
import {
  getLikeQueryOperand,
  splitName,
} from '../../../common/utils/string.utils';
import { ContractService } from '../../../core/contract/service/contract.service';
import { TemplateService } from '../../../core/templation/service/template.service';
import { EventService } from '../../../core/event/service/event.service';
import { TaskService } from '../../../core/task/service/task.service';
import { hasPermission } from '../../../common/utils/permission.utils';
import { UserSirenService } from '../../siren/service/user.siren.service';
import { RequestDemoInput } from '../types/contact.type';
import { get } from 'express-http-context';
import { RequestDetails } from 'src/common/decorator/custom.transactional.constants';
// import IPAPIService from 'src/core/authentication/service/ipapi.service';

@Injectable()
export default class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserOrganisation)
    private usersOrgRepository: Repository<UserOrganisation>,
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(GroupPermission)
    private groupPermissionRepository: Repository<GroupPermission>,
    private permissionCacheService: PermissionCacheService,
    private userCacheService: UserCacheService,
    private groupCacheService: GroupCacheService,
    private cacheManager: RedisCacheService,
    private connection: Connection,
    private authenticationHelper: AuthenticationHelper,
    private authBlockchain: AuthBlockchainService,
    private userMailService: UserMailService,
    private configService: ConfigService,
    private planItemService: PlanItemService,
    private organisationService: OrganisationService,
    private userLinkedAccountsService: UserLinkedAccountsService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
    private groupService: GroupService,
    private userOrganisationService: UserOrganisationService,
    private orgMFAService: OrganisationMultiFactorAuthService,
    @Inject(forwardRef(() => UserauthService))
    private userauthService: UserauthService,
    private permissionService: PermissionService,
    @Inject(forwardRef(() => ContractService))
    private contractService: ContractService,
    private templateService: TemplateService,
    private eventService: EventService,
    private taskService: TaskService,
    @Inject(forwardRef(() => UserSirenService))
    private userSirenService: UserSirenService, // private ipapiService: IPAPIService,
  ) {
    super(usersRepository);
  }

  /**
   * To get a User by id
   * @param id
   * @param entityManager
   * @returns User
   */
  async getUserById(id: string, entityManager?: EntityManager): Promise<User> {
    const userRepo = entityManager
      ? entityManager.getRepository(User)
      : this.usersRepository;
    const user = await userRepo.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new UserNotFoundException(id);
  }

  /**
   * Finds a user using the given conditions.
   * Throws the given error message if not found.
   * @param queryObj query object to  find the user
   * @returns User
   */

  async findOne(queryObj: FindOneOptions<User>): Promise<User | null> {
    return await this.usersRepository.findOne(queryObj);
  }

  /**
   * Find one user using given conditions
   * @param query
   * @param errorMessage message to throw in error
   * @returns User
   */
  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<User> | string,
    errorMessage?: string,
  ): Promise<User> {
    return await super.findOneOrFail(query, errorMessage);
  }

  /**
   * Function to save the user or list of users
   * @param user
   */
  public async save(user: User | User[]): Promise<User | User[]> {
    const out = await this.usersRepository.save(
      Array.isArray(user) ? user : [user],
    );
    return Array.isArray(user) ? out : out[0];
  }

  /**
   * Function to get user by id from cache
   * @param id - user id
   */
  async getUserByCache(id: string): Promise<User> {
    const data: User | undefined = await this.cacheManager.get(
      `${USER_KEY}${id}`,
    );
    if (data) return data;
    const user = await this.findOneOrFail({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email'],
    });
    await this.setUserByCache(id, user);
    return user;
  }

  /**
   * Function to set user by id in cache
   * @param id - user id
   * @param user - User
   */
  async setUserByCache(id: string, user: User) {
    await this.cacheManager.set(`${USER_KEY}${id}`, user);
  }

  /**
   * Dedicated function to get user profile details from token
   * @param id primary key of user entity
   * @returns user profile
   */
  async getUserProfile(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new UserNotFoundException(id);
  }

  /**
   * To update User Groups
   * @param id
   * @param user
   * @param entityManager
   * @returns List of Groups
   */
  @Transactional()
  @EnableLog()
  async updateUserGroups(
    id: string,
    user: UpdateUserGroupInput,
    entityManager?: EntityManager,
  ): Promise<Group[]> {
    await this.getUserById(id, entityManager);
    const groupsInRequest = await this.groupRepository.findBy({
      id: In(user.groups),
    });
    const existingGroupsOfUser = await this.getUserGroups(id);

    const validGroupsInRequest: Set<string> = new Set(
      groupsInRequest.map((p) => p.id),
    );
    if (groupsInRequest.length !== user.groups.length) {
      throw new GroupNotFoundException(
        user.groups.filter((p) => !validGroupsInRequest.has(p)).toString(),
      );
    }
    // TODO: organisationId put empty here since this service needs modification to handle multi tenancy
    const groupsToBeRemovedFromUser: UserGroup[] = existingGroupsOfUser
      .filter((p) => !validGroupsInRequest.has(p.id))
      .map((g) => ({ userId: id, groupId: g.id, organisationId: '' }));
    const userGroups = this.userGroupRepository.create(
      user.groups.map((group) => ({ userId: id, groupId: group })),
    );
    const updateUserGroups = async (em: EntityManager) => {
      const userGroupsRepo = em.getRepository(UserGroup);
      await userGroupsRepo.remove(groupsToBeRemovedFromUser);
      await userGroupsRepo.save(userGroups);
    };
    entityManager
      ? await updateUserGroups(entityManager)
      : await this.connection.manager.transaction(async (entityManager) => {
          await updateUserGroups(entityManager);
        });

    const groups = await this.getUserGroups(id);
    await this.userCacheService.invalidateUserGroupsCache(id);
    return groups;
  }

  /**
   * To get User Groups
   * @param id
   * @returns List of Group
   */
  @EnableLog()
  async getUserGroups(id: string): Promise<Group[]> {
    const groups = await this.groupRepository
      .createQueryBuilder()
      .leftJoinAndSelect(UserGroup, 'userGroup', 'Group.id = userGroup.groupId')
      .where('userGroup.userId = :userId', { userId: id })
      .getMany();
    return groups;
  }

  /**
   * To update User Permissions
   * @param id
   * @param request
   * @returns List of Permissions
   */
  @Transactional()
  @EnableLog()
  async updateUserPermissions(
    id: string,
    request: UpdateUserPermissionInput,
  ): Promise<Permission[]> {
    await this.getUserById(id);
    const existingUserPermissions: Permission[] = await this.getUserPermissions(
      id,
    );
    const permissionsInRequest: Permission[] =
      await this.permissionRepository.findBy({
        active: true,
        id: In(request.permissions),
      });
    const validPermissions = new Set(permissionsInRequest.map((p) => p.id));
    if (permissionsInRequest.length !== request.permissions.length) {
      throw new PermissionNotFoundException(
        request.permissions.filter((p) => !validPermissions.has(p)).toString(),
      );
    }

    const userPermissionsToBeRemoved: UserPermission[] = existingUserPermissions
      .filter((p) => !validPermissions.has(p.id))
      .map((p) => ({ userId: id, permissionId: p.id }));
    this.userPermissionRepository.remove(userPermissionsToBeRemoved);

    const userPermissionsCreated = this.userPermissionRepository.create(
      request.permissions.map((permission) => ({
        userId: id,
        permissionId: permission,
      })),
    );

    const userPermissionsUpdated = await this.connection.transaction(
      async (entityManager) => {
        const userPermissionsRepo = entityManager.getRepository(UserPermission);
        await userPermissionsRepo.remove(userPermissionsToBeRemoved);
        return await userPermissionsRepo.save(userPermissionsCreated);
      },
    );

    const userPermissions = await this.permissionRepository.findBy({
      id: In(userPermissionsUpdated.map((u) => u.permissionId)),
    });

    await this.userCacheService.invalidateUserPermissionsCache(id);
    return userPermissions;
  }

  /**
   * To get User Permissions
   * @param id
   * @returns List of Permission
   */
  async getUserPermissions(id: string): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder()
      .leftJoinAndSelect(
        UserPermission,
        'userPermission',
        'Permission.id = userPermission.permissionId',
      )
      .where('userPermission.userId = :userId', { userId: id })
      .getMany();
    return permissions;
  }
  /**
   * Function to get all permissions of user
   * find all group and individual permissions
   * Then filter out permissios based on subscription
   * @param user - athenticated user
   * @returns - list of permission object
   */
  async getAllPermissionsOfUser(user: AccessTokenData): Promise<Permission[]> {
    const rolePermissions = await this.getAllGroupPermissionsOfUser(
      user.id,
      user.organisation.id,
    );
    const planPermissions = await this.getAllOrgPermissions(
      user.organisation.id,
    );
    const planPermissionsIds = planPermissions.map((item) => item.id);
    const userPermissions = rolePermissions.filter((item) =>
      planPermissionsIds.includes(item.id),
    );
    return userPermissions.length
      ? userPermissions
      : await this.permissionService.find({
          name: In(DefaultCustomerPermissions),
        });
  }
  /**
   * Function to get all permissions of given organisation
   * @param id - organisation id
   * @param planPermissions - only check for those permissions
   * @returns - list of permission object
   */
  async getAllOrgPermissions(
    id: string,
    planPermissions?: PermissionsType[],
  ): Promise<Permission[]> {
    const planItems = await this.subscriptionService.getActivePlanItemsCache(
      id,
    );
    return await this.getAllPlanPermissions(planItems, planPermissions);
  }
  /**
   * Function to get all permissions of given plans
   * @param planItems - array of external plan item id
   * @param planPermissions - only check for those permissions
   * @returns - list of permission object
   */
  async getAllPlanPermissions(
    planItems: string[],
    planPermissions?: PermissionsType[],
  ): Promise<Permission[]> {
    const query = this.permissionRepository
      .createQueryBuilder()
      .innerJoinAndSelect(
        PlanItemPermission,
        'planItemPermission',
        'planItemPermission.permission_id = Permission.id',
      )
      .innerJoinAndSelect(
        PlanItem,
        'planItem',
        'planItem.id = planItemPermission.planItemId AND planItem.externalId  IN (:...planItems)',
        { planItems },
      );
    planPermissions?.length &&
      query.andWhere('Permission.name IN (:...planPermissions)', {
        planPermissions,
      });
    return await query
      .distinct(true)
      .select(['Permission.id', 'Permission.name', 'Permission.active'])
      .getMany();
  }
  /**
   * Function to get all permissions of user based on role and organisation
   * @param id - primary key of user
   * @param orgId - id of organisation
   * @returns - list of permission object
   */
  async getAllGroupPermissionsOfUser(
    id: string,
    orgId: string,
  ): Promise<Permission[]> {
    const groupPermissionQuery = this.permissionRepository
      .createQueryBuilder()
      .innerJoinAndSelect(
        GroupPermission,
        'groupPermission',
        'groupPermission.permission_id = Permission.id',
      )
      .innerJoinAndSelect(
        UserGroup,
        'userGroup',
        'userGroup.group_id = groupPermission.group_id AND userGroup.userId = $1 AND userGroup.organisation_id = $2',
      )
      .distinct(true)
      .select(['id', 'name', 'active'])
      .getQuery();

    const userPermissionsQuery = this.permissionRepository
      .createQueryBuilder()
      .innerJoinAndSelect(
        UserPermission,
        'userPermission',
        'userPermission.permission_id = Permission.id AND userPermission.userId = $1',
      )
      .distinct(true)
      .select(['id', 'name', 'active'])
      .getQuery();
    const permissions = await this.permissionRepository.query(
      `${groupPermissionQuery} UNION ${userPermissionsQuery}`,
      [id, orgId],
    );
    return permissions;
  }

  /**
   * To get all permission ids for User
   * @param user
   */
  private async getAllUserpermissionIds(
    user: AccessTokenData,
  ): Promise<Set<string>> {
    const planItems = await this.subscriptionService.getActivePlanItemsCache(
      user.organisation.id,
    );
    const planPermissions: string[] = (
      await Promise.all(
        planItems.map((x) =>
          this.subscriptionService.getPlanPermissionsFromExtId(x),
        ),
      )
    ).flat(1);
    const planPermissionsSet: Set<string> = new Set(planPermissions);

    const userGroups = await this.userCacheService.getUserGroupsByUserId(
      user.id,
      user.organisation.id,
    );
    // TODO - define set instead of string[] for better performance
    const groupPermissions: string[] = (
      await Promise.all(
        userGroups.map((x) =>
          this.groupCacheService.getGroupPermissionsFromGroupId(x),
        ),
      )
    ).flat(1);
    const groupPermissionsSet: Set<string> = new Set(groupPermissions);

    /* // Not using direct user permission now - removing for better peformance
    const userPermissions: string[] =
      await this.userCacheService.getUserPermissionsByUserId(id);

    const allPermissionsOfUser = new Set(
      userPermissions.concat(groupPermissions),
    ); */
    groupPermissionsSet.forEach(
      (item) =>
        !planPermissionsSet.has(item) && groupPermissionsSet.delete(item),
    );
    if (groupPermissionsSet.size === 0) {
      const defaultPermissions = await this.permissionService.find({
        name: In(DefaultCustomerPermissions),
      });
      return new Set(defaultPermissions.map((item) => item.id));
    }
    return groupPermissionsSet;
  }

  /**
   * To verify the User permissions
   * @param user
   * @param permissionToVerify
   * @param operation
   * @param allPermissionsOfUser
   */
  async verifyUserPermissions(
    user: AccessTokenData,
    permissionToVerify: string[],
    operation: OperationType = OperationType.AND,
    permissionToTrack: string[],
    allPermissionsOfUser?: Set<string>,
  ): Promise<{ status: boolean; matchedPermissions: string[] }> {
    const permissionsRequired = (
      await Promise.all(
        permissionToVerify.map((p) =>
          this.permissionCacheService.getPermissionsFromCache(p),
        ),
      )
    ).flat(1);

    if (permissionsRequired.length !== permissionToVerify.length) {
      const validPermissions = new Set(permissionsRequired.map((p) => p.name));
      throw new PermissionNotFoundException(
        permissionToVerify.filter((p) => !validPermissions.has(p)).toString(),
      );
    }
    allPermissionsOfUser =
      allPermissionsOfUser || (await this.getAllUserpermissionIds(user));
    if (!allPermissionsOfUser) {
      allPermissionsOfUser = new Set();
    }
    const requiredPermissionsWithUser = permissionsRequired.filter((x) => {
      return (allPermissionsOfUser as Set<string>).has(x.id);
    });
    let status = false;
    switch (operation) {
      case OperationType.AND:
        status =
          permissionsRequired.length > 0 &&
          requiredPermissionsWithUser.length === permissionsRequired.length;
        break;
      case OperationType.OR:
        status = requiredPermissionsWithUser.length > 0;
        break;
      default:
        status = false;
    }
    const matchedPermissions = requiredPermissionsWithUser.map(
      (item) => item.name,
    );
    if (permissionToTrack.length > 0) {
      const permissionsToBeTrack = (
        await Promise.all(
          permissionToTrack.map((p) =>
            this.permissionCacheService.getPermissionsFromCache(p),
          ),
        )
      ).flat(1);
      permissionsToBeTrack.map((item) => {
        (allPermissionsOfUser as Set<string>).has(item.id) &&
          matchedPermissions.push(item.name);
      });
    }
    return { matchedPermissions, status };
  }

  /**
   * To get all User Permissions and verify it
   * @param user - Authenticated user
   * @param permissionToVerify - list of permission to be verified
   * @param operation - logical operation type - AND, OR
   * @param permissionToTrack - list of permission to be tracked
   * Will add these permission to matchedPermissions if user has corresponding permissions
   */
  async verifyAndFetchUserPermissions(
    user: AccessTokenData,
    permissionToVerify: string[],
    operation: OperationType = OperationType.AND,
    permissionToTrack: string[],
  ): Promise<{ verified: boolean; matchedPermissions: string[] }> {
    const allPermissionsOfUser = await this.getAllUserpermissionIds(user);
    const { status, matchedPermissions } = await this.verifyUserPermissions(
      user,
      permissionToVerify,
      operation,
      permissionToTrack,
      allPermissionsOfUser,
    );
    return {
      verified: status,
      matchedPermissions,
    };
  }

  /**
   * Dedicated function to get the user for token generation.
   * @param where Condition against user table
   * @returns user object or undefined
   */
  async getUserDetailsForToken(
    where: FindOptionsWhere<User>,
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      relations: [
        'userOrganisation',
        'userOrganisation.organisation',
        'userLinkedAccounts',
      ],
      where,
    });
  }

  /**
   * Get user by given condition.
   * @param where Condition against user table
   * @returns user object or undefined
   */
  async getUserByCondition(
    where: FindOptionsWhere<User>,
    relations?: string[],
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where,
      relations,
    });
  }

  /**
   * To get the group to be assign when a user signup
   * @returns array of group
   */
  async getDefalutCustomergroup(): Promise<Group | null> {
    const group = await this.groupRepository.findOneBy({
      active: true,
      type: UserType.Customer,
      name: CustomerGroupType.Owner,
    });
    return group;
  }

  /**
   * To get the organisation subscription object based on the plan choosed
   * @param planDetail plan detail - optional
   * return empty arrat if plan detail does not provide or invalid plan details provided
   * @returns array of organisation subscription
   */
  async getOrganisationSubscriptions(
    planDetail?: PlanDetail,
  ): Promise<OrganisationSubscription[]> {
    if (!planDetail) return [];
    try {
      const planItem = await this.planItemService.findOneOrFail({
        relations: ['plan'],
        where: {
          plan: { name: planDetail.plan },
          billingMode: planDetail.billingMode,
        },
      });
      const organisationSubscription = planItem
        ? [
            {
              planItemId: planItem.id,
              subscriptionMode: planDetail.subscriptionMode,
              billingMode: planDetail.billingMode,
              status: SubscriptionStatus.Future,
              quantity: 1,
            } as any,
          ]
        : [];
      return organisationSubscription;
    } catch {
      return [];
    }
  }

  /**
   * Function is to create user during signup(native, google and singpass)
   * And also to create a new user as contract recipient.
   * organisation is also created because user should always belongs to an organisation
   * When user provides organisation details, those are added to this created organisation table
   * @param user available user details
   * @param planDetail plan detail - optional, if exists, a plan created with status as future
   * @returns created user
   */
  @EnableLog()
  async createUser(
    user: ObjectLiteral,
    planDetail?: PlanDetail,
  ): Promise<User> {
    const organisationSubscription: OrganisationSubscription[] =
      await this.getOrganisationSubscriptions(planDetail);
    const userObj = {
      ...user,
      isActive: true,
      userOrganisation: [
        {
          organisation: {
            origin: OrganisationOrigin.Application,
            organisationSubscription,
          } as Organisation,
        } as UserOrganisation,
      ],
    } as User;
    const createdUser = await this.saveUser(userObj);
    const organisation = createdUser.userOrganisation[0].organisation;

    const defaultGroup = await this.getDefalutCustomergroup();
    if (defaultGroup) {
      const userGroup = [
        {
          userId: createdUser.id,
          groupId: defaultGroup.id,
          organisationId: createdUser.userOrganisation[0].organisationId,
        } as UserGroup,
      ];
      await this.groupService.createUserGroup(userGroup);
    }
    // updating organisation createdById - cascad limitation.
    await this.organisationService.update(organisation.id, {
      createdById: createdUser.id,
    });
    createdUser.userOrganisation[0].organisation.createdById = createdUser.id;
    return createdUser;
  }

  /**
   * To create a user without creating user organisation
   * @param user
   * @returns user
   */
  @EnableLog()
  async createUserV2(user: ObjectLiteral): Promise<User> {
    const userObj = {
      ...user,
      isActive: true,
    } as User;
    return await this.saveUser(userObj);
  }

  /**
   * Function is to get user from a condition and if no user present, a new user is created
   * organisation is also created because user should always belongs to an organisation
   * When user provides organisation details, those are added to this created organisation table
   * @param where a condition - usually where email equal given mail
   * @param user
   * @returns created user
   */
  async getOrCreate(
    where: FindOptionsWhere<User>,
    user: ObjectLiteral,
  ): Promise<User> {
    const userExisting = await this.usersRepository.findOne({
      relations: ['userOrganisation'],
      where,
    });
    if (userExisting) {
      (!userExisting.firstName || !userExisting.lastName) &&
        this.updateUser(userExisting.id, {
          firstName: user.firstName,
          lastName: user.lastName,
        });
      return userExisting;
    }
    return this.createUser(user);
  }

  /**
   * Function is to create user with roles under organisation
   * @param input
   * @param authUser
   * @returns created user
   */
  @Transactional()
  @EnableLog()
  async createUserWithRole(
    input: CreateUserWithRoleInput,
    authUser: AccessTokenData,
  ): Promise<User> {
    const currentUserCount = await this.getOrgUserCount(
      authUser.organisation.id,
    );
    const subscription =
      await this.subscriptionService.getCurrentSubscriptionInfo(
        authUser.organisation.id,
      );
    const maxAllowedUserCount: number = subscription.userCount;
    if (currentUserCount >= maxAllowedUserCount) {
      generalError(
        `Cannot create user! Please upgrade your subscription or inactivate 1 user.`,
      );
    }
    const groups = await this.groupRepository.findBy({
      active: true,
      type: UserType.Customer,
      id: In(input.groups),
    });
    if (!groups.length)
      throw new GeneralApplicationException('group ids provided are invalid');

    // Check weather user already exists
    let user = await this.usersRepository.findOne({
      where: { email: input.email },
      relations: ['userOrganisation', 'userOrganisation.organisation'],
    });
    if (user) {
      if (
        user.userOrganisation.find(
          (item) => item.organisationId === authUser.organisation.id,
        )
      ) {
        generalError('This user is already assigned to this organisation');
      }
      // if user signed up, but not yet added detail, need add name
      if (!user.firstName) {
        user.firstName = input.firstName;
        user.lastName = input.lastName;
      }
      user.userOrganisation.push({
        organisationId: authUser.organisation.id,
        inviteStatus: InviteStatus.Invited,
      } as UserOrganisation);
    } else {
      user = {
        email: input.email,
        isEmailVerified: false,
        firstName: input.firstName,
        lastName: input.lastName,
        isActive: true,
        origin: UserOrigin.OrganisationUser,
        createdBy: authUser.id,
        userOrganisation: [
          {
            organisationId: authUser.organisation.id,
            inviteStatus: InviteStatus.Invited,
          } as UserOrganisation,
        ],
      } as User;
    }
    user = await this.saveUser(user);
    const userGroups = groups.map((item) => {
      return {
        userId: user?.id,
        group: item,
        organisationId: authUser.organisation.id,
      } as UserGroup;
    });
    await this.groupService.createUserGroup(userGroups);
    const token = await this.authenticationHelper.generateSignedJWT(
      {
        userOrgId: user.userOrganisation.find(
          (item) => item.organisationId === authUser.organisation.id,
        )?.id,
      } as UserOrganisationInviteTokenClaims,
      TokenType.UserOrganisationInviteToken,
    );
    const organisation =
      await this.organisationService.getOrganisationByCondition({
        id: authUser.organisation.id,
      });
    const fromUser = await this.getUserById(authUser.id);
    await this.userSirenService.sendAddUserToOrganisationMail(
      input.firstName,
      fromUser.fullName,
      `${input.email}`,
      organisation?.name as string,
      token,
    );
    return user;
  }

  /**
   * To edit user roles
   * @param input input to edit user roles
   * @returns message
   */
  @Transactional()
  @EnableLog()
  async editUserRoles(
    input: EditUserRolesInput,
    user: AccessTokenData,
  ): Promise<StatusResponse> {
    // Check if the user belongs to the organisation
    await this.userOrganisationService.findOneOrFail({
      where: { userId: input.userId, organisationId: user.organisation.id },
    });
    // Find and delete all existing roles of edited user from the group repo
    const currentRolesData = await this.userGroupRepository.findBy({
      organisationId: user.organisation.id,
      userId: input.userId,
    });
    await this.userGroupRepository.remove(currentRolesData);
    // Validate group ids
    const groups = await this.groupRepository.findBy({
      active: true,
      type: UserType.Customer,
      id: In(input.groups),
    });
    if (!groups.length || groups.length !== input.groups.length)
      throw new GeneralApplicationException(`Group Id's provided are invalid`);
    // Format data sent from FE inorder to insert and save
    const newRolesData = input.groups.map((group) => ({
      userId: input.userId,
      organisationId: user.organisation.id,
      groupId: group,
    }));
    await this.userGroupRepository.save(newRolesData);
    const noActiveOwners = await this.checkActiveOwners(user.organisation.id);
    noActiveOwners &&
      generalError('At least one active owner should exist in an organisation');
    // clear cache
    await this.userCacheService.invalidateUserGroupsCache(input.userId);
    return {
      message: 'OK',
    };
  }

  /**
   * To check active owners exist within an organisation
   * @param organisationId organisationId of the user
   * @param userId - userId (userId to be excluded from active owners check)
   * @returns boolean
   */
  public async checkActiveOwners(
    organisationId: string,
    userId: string | null = null,
  ) {
    // Check if at least one active owner exists in the previously edited organisation
    // If not, return true
    const query = await this.userGroupRepository
      .createQueryBuilder('userGroup')
      .leftJoin('Group', 'group', 'userGroup.groupId = group.id')
      .leftJoin('User', 'user', 'userGroup.userId = user.id')
      .innerJoin(
        'user.userOrganisation',
        'userOrganisation',
        'userOrganisation.organisationId = :organisationId',
        {
          organisationId,
        },
      )
      .where('userGroup.organisationId = :organisationId', { organisationId })
      .andWhere('group.name = :name', { name: CustomerGroupType.Owner })
      .andWhere('userOrganisation.status = :active', {
        active: UserOrganisationStatus.Active,
      });
    userId && query.andWhere('userGroup.userId != :userId', { userId });
    const activeOwners = await query.getCount();
    return activeOwners === 0;
  }

  /**
   * To update user profile
   * @param input input to update the user profile
   * @returns User
   */
  @Transactional()
  @EnableLog()
  async updateUserProfile(
    input: UpdateUserInput,
    user: AccessTokenData,
  ): Promise<User> {
    const userExisting = await this.findOneOrFail({
      where: { id: user.id },
    });
    // If name field provided, split and update first name and last name
    if (input.name) {
      const { firstName, lastName } = splitName(input.name);
      userExisting.firstName = firstName || undefined;
      userExisting.lastName = lastName || undefined;
    } else {
      userExisting.firstName = input.firstName;
      userExisting.lastName = input.lastName;
    }
    input.nationalId !== undefined &&
      (userExisting.nationalId = input.nationalId);
    input.dob !== undefined && (userExisting.dob = input.dob as Date);
    input.address != undefined && (userExisting.address = input.address);
    input.gender != undefined && (userExisting.gender = input.gender);
    input.countryId != undefined && (userExisting.countryId = input.countryId);
    input.phone != undefined && (userExisting.phone = input.phone);
    return await this.update(userExisting);
  }

  async updateField(id: string, field: string, value: any): Promise<User> {
    await this.usersRepository.update(id, { [field]: value });
    const updatedUser = await this.usersRepository.findOneBy({ id });
    if (updatedUser) {
      return updatedUser;
    }
    throw new UserNotFoundException(id);
  }

  /**
   * Function is to list all users belongs to the organisation.
   * @param filterInput filtering conditions
   * @returns user list
   */
  @EnableLog()
  public async getUsers(
    user: AccessTokenData,
    filterInput: GetUsersFilterInput,
  ) {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.userOrganisation',
        'userOrganisation',
        'userOrganisation.organisationId = :organisationId',
        {
          organisationId: user.organisation.id,
        },
      );

    filterInput.q &&
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            `trim(both from COALESCE(user.firstName, '') || ' ' || COALESCE(user.lastName, '')) ILike :q OR user.email ILike :q`,
            { q: getLikeQueryOperand(filterInput.q!) },
          );
        }),
      );
    filterInput.userOrgStatus &&
      query.andWhere('userOrganisation.status = :userOrgStatus', {
        userOrgStatus: filterInput.userOrgStatus,
      });
    !hasPermission(user, PermissionsType.CustomerActivateUsers) &&
      query.andWhere('userOrganisation.status = :active', {
        active: UserOrganisationStatus.Active,
      });
    const [res, count] = await query
      .addOrderBy('userOrganisation.createdAt', 'ASC')
      .addOrderBy('userOrganisation.userId', 'ASC')
      .skip(filterInput.pagination.offset)
      .take(filterInput.pagination.limit)
      .getManyAndCount();

    // Getting active user count here
    const activeUsersCount = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.userOrganisation',
        'userOrganisation',
        'userOrganisation.organisationId = :organisationId',
        {
          organisationId: user.organisation.id,
        },
      )
      .andWhere('userOrganisation.status = :active', {
        active: UserOrganisationStatus.Active,
      })
      .getCount();
    return {
      activeUsersCount,
      users: res,
      pagination: getPaginationMetaData(filterInput.pagination, count),
    };
  }

  /**
   * To get Users by their Id's
   * @param userIds
   */
  public async getUsersByIds(userIds: string[]) {
    return await this.usersRepository.findBy({
      id: In(userIds),
    });
  }

  /**
   * To assign assets of one user to others
   * @param organisationId
   * @param fromUserId
   * @param toUserId
   * @returns array of object contains asset name and count of assets that has been assigned
   */
  public async assignUserAssets(
    organisationId: string,
    fromUserId: string,
    toUserId: string,
  ): Promise<UserAssetCountObject[]> {
    const base = { organisationId, fromUserId };
    const [contractUpdt, templateUpdt, clauseUpdt, eventUpdt, taskUpdt] =
      await Promise.all([
        this.contractService.assignContract(base, toUserId),
        this.templateService.assignTemplate(base, toUserId),
        this.templateService.assignClause(base, toUserId),
        this.eventService.assignEvent(base, toUserId),
        this.taskService.assignTask(base, toUserId),
      ]);
    return [
      {
        name: UserAsset.Contract,
        count: contractUpdt.affected,
      },
      {
        name: UserAsset.Template,
        count: templateUpdt.affected,
      },
      {
        name: UserAsset.Clause,
        count: clauseUpdt.affected,
      },
      {
        name: UserAsset.Event,
        count: eventUpdt.affected,
      },
      {
        name: UserAsset.Task,
        count: taskUpdt.affected,
      },
    ];
  }

  /**
   * To get User Asset count
   * @param user Authenticated User
   * @returns array of object contains asset name and count
   */
  public async getUserAssetCount(
    userId: string,
    organisationId: string,
  ): Promise<UserAssetCountObject[]> {
    await this.userOrganisationService.findOneOrFail(
      {
        userId,
        organisationId,
      },
      'The given user id is not part of this organisation',
    );
    const base = {
      organisationId: organisationId,
      createdById: userId,
    };
    const [contractCount, templateCount, clauseCount, eventCount, taskCount] =
      await Promise.all([
        this.contractService.getAssignContractCount(base),
        this.templateService.getAssignTemplateCount(base),
        this.templateService.getAssignClauseCount(base),
        this.eventService.getAssignEventCount(base),
        this.taskService.getAssignTaskCount(base),
      ]);
    return [
      {
        name: UserAsset.Contract,
        count: contractCount,
      },
      {
        name: UserAsset.Template,
        count: templateCount,
      },
      {
        name: UserAsset.Clause,
        count: clauseCount,
      },
      {
        name: UserAsset.Event,
        count: eventCount,
      },
      {
        name: UserAsset.Task,
        count: taskCount,
      },
    ];
  }
  /**
   * To save User and add to blockchain
   * @param userObj
   * @returns User
   */
  public async saveUser(userObj: User) {
    const newUser = await this.usersRepository.save(userObj);
    return newUser;
  }

  /**
   * Function to get user count in an organisation
   * @param organisationId
   * @returns
   */
  public async getOrgUserCount(organisationId: string) {
    return await this.usersOrgRepository.count({
      where: {
        organisationId,
        status: UserOrganisationStatus.Active,
      },
    });
  }

  /**
   * To handle invite request from organisation to user.
   * @param token token with claims: userOrgId and token type
   */
  @Transactional()
  @EnableLog()
  public async userOrganisationInvitation(token: string) {
    const payload: UserOrganisationInviteTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.UserOrganisationInviteToken,
      );
    const userOrg = await this.userOrganisationService.findOne({
      where: { id: payload.userOrgId },
      relations: ['user'],
    });
    if (!userOrg || userOrg.status === UserOrganisationStatus.Inactive) {
      return {
        action: 'redirectToInvitationNotFound',
        message:
          'It seems like your invitation to the organisation has been revoked.',
      };
    } else {
      if (userOrg.user.isEmailVerified) {
        userOrg.inviteStatus === InviteStatus.Invited &&
          (userOrg.inviteStatus = InviteStatus.Accepted) &&
          (await this.userOrganisationService.saveUserOrganisation(userOrg));
        return {
          action: 'redirectToLogin',
          message: 'User is already verfied. Login to your organisation',
        };
      } else {
        const token = await this.authenticationHelper.generateSignedJWT(
          {
            email: userOrg.user.email,
            userOrgId: userOrg.id,
            type: 'userAddedToOrganisation',
          } as UpdatePasswordTokenClaims,
          TokenType.UpdatePasswordToken,
        );
        return {
          action: 'redirectToSetPassword',
          message: 'User not yet onboarded',
          token,
          email: userOrg.user.email,
        };
      }
    }
  }

  public async update(user: User) {
    const savedUser = await this.usersRepository.save(user);
    //TODO: update user in blockchain.
    return savedUser;
  }

  public async updateUser(id: string, set: ObjectLiteral) {
    return this.usersRepository.update({ id }, set);
  }

  // TODO- add pagination
  public async getAllUsers() {
    return this.usersRepository.find({ relations: ['userOrganisation'] });
  }

  /**
   * To update email with a new one
   * @param email
   * @param newEmail
   * @param singpass
   */
  @Transactional()
  @EnableLog()
  async updateEmail(
    email: string,
    newEmail: string,
    singpass: boolean,
  ): Promise<ObjectLiteral> {
    this.configService.get('ENV') === 'production' &&
      generalError('Invalid access');
    const existingUser = await this.getUserByCondition({ email });
    if (!existingUser) {
      throw new GeneralApplicationException('entered email not exist');
    }
    const isExist = await this.getUserByCondition({ email: newEmail });
    isExist && generalError('new email already exist');
    existingUser.email = newEmail;
    this.update(existingUser);
    const userLinkAccount =
      singpass &&
      (await this.userLinkedAccountsService.find({
        where: {
          userId: existingUser.id,
          platform: LinkedAccountPlatform.Singpass,
        },
      }));
    typeof userLinkAccount === 'boolean'
      ? userLinkAccount
      : userLinkAccount.length > 0 &&
        (await this.userLinkedAccountsService.delete({
          id: userLinkAccount[0].id,
        }));
    return { status: 'OK' };
  }

  /**
   * Function is to switch organisation for logged in user
   * @param input id of user organisation object
   * @returns token object
   */
  @Transactional()
  @EnableLog()
  async switchOrganisation(
    input: SwitchOrganisationInput,
    authUser: AccessTokenData,
    response: Response,
  ): Promise<AuthOutput> {
    const userOrg = await this.userOrganisationService.findOneOrFail({
      where: {
        id: input.userOrgId,
        userId: authUser.id,
      },
      relations: ['organisation', 'user'],
    });
    const authResponse = await this.userauthService.checkOrgAuthentication(
      userOrg.user,
      UserType.Customer,
      true,
      true,
      userOrg,
    );
    if (
      [
        LoginResponseCode.MFA_AUTH_REQUIRED.statusCode,
        LoginResponseCode.MFA_SETUP_REQUIRED.statusCode,
      ].includes(authResponse.statusCode)
    )
      return authResponse;
    await this.userCacheService.invalidateUserGroupsCache(userOrg.userId);
    await this.userauthService.addtokenToResponse(response, authResponse.token);
    return authResponse;
  }

  /**
   * Inactivate all users except the oldest active owner.
   * Note: If there are two or more activer owners,
   * the one who was created first will be the one remaining.
   * @param organisationId organisation id
   */
  @Transactional()
  @EnableLog()
  async inactivateAllExceptOwner(organisationId: string) {
    const userOrgs = await this.usersOrgRepository.find({
      where: {
        organisationId,
        status: UserOrganisationStatus.Active,
      },
      relations: ['user', 'user.userGroup', 'user.userGroup.group'],
    });
    let ownerIndex = 0;
    let owner: UserOrganisation | undefined;
    userOrgs.forEach((userOrg, index) => {
      if (
        userOrg.user.userGroup.find((ug) => {
          return ug.group?.name === CustomerGroupType.Owner;
        })
      ) {
        if (!owner || (owner.createdAt as Date) > (userOrg.createdAt as Date)) {
          owner = userOrg;
          ownerIndex = index;
        }
      }
    });
    if (!ownerIndex) ownerIndex = 0;
    userOrgs.splice(ownerIndex, 1); // all users except the oldest active owner
    if (userOrgs.length != 0) {
      userOrgs.map((item) => {
        // Removing users's group cache. Next time when user try a request,
        // authorisation guard will also check for user organisation status
        this.userCacheService.invalidateUserGroupsCache(item.userId);
        item.status = UserOrganisationStatus.Inactive;
        return item;
      });
      await this.usersOrgRepository.save(userOrgs);
    }
    this.subscriptionService.invalidateOrganisationCache(organisationId);
  }

  /**
   * To send mail for resetting MFA
   * @param userEmail
   */
  @EnableLog()
  public async sendResetMfaMail(token: string) {
    const { userId, userOrgId }: TotpTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.MfaToken,
      );
    ((await this.cacheManager.get(
      `${FAILED_OTPLOGIN_ATTEMPTS}-${userId}-${userOrgId}`,
    )) as number) >= MAX_FAILED_OTP_ATTEMPTS &&
      generalError('Too many failed attemps. Please try again in 10 minutes.');
    const { email, firstName } = await this.findOneOrFail({
      where: { id: userId, isCustomer: true },
    });

    const resetMfaToken = await this.authenticationHelper.generateSignedJWT(
      {
        userId,
        userOrgId,
        requestTime: new Date(),
      } as ResetMfaTokenClaims,
      TokenType.ResetMfaToken,
    );
    const organisation = await this.organisationService.findOne(userOrgId);
    await this.userSirenService.sendResetMfaMail(
      firstName || 'User',
      email,
      organisation?.name || '',
      resetMfaToken,
    );
    return {
      message: 'Email sent successfully',
    };
  }

  /**
   * To reset MFA
   * @param token
   */
  @EnableLog()
  public async resetMfa(token: string) {
    const { userId, requestTime, userOrgId }: ResetMfaTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.ResetMfaToken,
      );
    // Check if 8 hours have passed since the e-mail was sent
    if (
      new Date().getTime() - new Date(requestTime).getTime() >
      8 * 60 * 60 * 1000
    ) {
      return {
        message: 'Time expired for resetting multi-factor authentication',
        notification: 'reset-mfa-time-expired-error',
      };
    }
    await this.userLinkedAccountsService.delete({
      userId,
      organisationId: userOrgId,
      type: LinkedAccountType.Auth,
      platform: LinkedAccountPlatform.TOTP,
    });
    const user = await this.findOneOrFail({
      where: {
        id: userId,
        isCustomer: true,
        userOrganisation: {
          organisationId: userOrgId,
          status: UserOrganisationStatus.Active,
        },
      },
      relations: ['userOrganisation', 'userOrganisation.organisation'],
    });
    // Send a mail to the organisation owner
    const activeOwners = await this.findActiveOwners(userOrgId);
    let owner = activeOwners.find(
      (owner: { userId: string }) =>
        owner.userId === user?.userOrganisation[0]?.organisation?.createdById,
    );
    owner = owner || activeOwners[0];
    if (owner?.user?.id !== user.id) {
      const ownerFirstName = owner?.user?.firstName;
      const ownerEmail = owner?.user?.email;
      ownerEmail &&
        (await this.userSirenService.sendResetMfaMailToAdmin(
          ownerFirstName || '',
          ownerEmail,
          user.fullName,
          user.email,
        ));
    }
    return {
      message: 'MFA reset successfully',
      notification: 'reset-mfa',
    };
  }

  /**
   * To find all active owners of the organisation.
   * @param organisationId organisationId
   * @returns list of active owners
   */
  public async findActiveOwners(organisationId: string) {
    const queryObject: FindManyOptions<UserGroup> = {
      where: {
        user: {
          userOrganisation: {
            organisationId: organisationId,
            status: UserOrganisationStatus.Active,
          },
        },
        group: {
          name: CustomerGroupType.Owner,
        },
      },
      relations: ['group', 'user', 'user.userOrganisation'],
    };
    return await this.userGroupRepository.find(queryObject);
  }

  /**
   * To sent a request demo mail from user to contact us
   * @param input contains form data of request demo
   */
  @EnableLog()
  public async requestDemo(data: RequestDemoInput) {
    const { ip, userAgent } = get(RequestDetails);
    // let ipData;
    // if (ip) {
    //   try {
    //     ipData = await this.ipapiService.getGeoLocation(ip);
    //   } catch (error) {
    //     console.log('Error in getting IP data', error);
    //   }
    // }
    await this.userSirenService.sendRequestDemoMail(data, userAgent, undefined);
  }
}
