import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { Response } from 'express';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CreateUserWithRoleInput,
  StatusResponse,
  EditUserRolesInput,
  GetUsersFilterInput,
  Group,
  Permission,
  UpdateUserGroupInput,
  UpdateUserInput,
  UserOrganisationStatus,
  AuthOutput,
  GetUserAssetsCountOutput,
} from '../../schema/graphql.schema';
import UserService from '../../../core/authorization/service/user.service';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import {
  AccessTokenData,
  CustomerGroupType,
  PermissionsType,
} from '../../../core/authorization/constants/authorization.constants';
import User from '../../../core/authorization/entity/user.entity';
import { validate } from '../../../common/utils/validation.utils';
import {
  CreateUserWithRoleValidator,
  UpdateUserSchema,
} from '../../../core/authorization/validation/user.validation.schema';
import Country from '../../../core/authorization/entity/country.entity';
import DataLoader from 'dataloader';
import { ObjectLiteral } from 'typeorm';
import UserOrganisation from '../../../core/authorization/entity/user.organisation.entity';
import OrganisationService from '../../../core/authorization/service/organisation.service';
import { SwitchOrganisationInput } from '../../../admin-interface/schema/graphql.schema';
import UserauthService from '../../../core/authentication/service/userauth.service';
import { InjectLoader } from '@keyvaluesystems/nestjs-dataloader';
import { UseAuthGuard } from '../../../core/authentication/authentication.decarator';
import { AuthTarget } from '../../../core/authentication/constants/authentication.constants';
import UserGroup from '../../../core/authorization/entity/userGroup.entity';
import { getEnumIndex } from '../../../common/utils/array.object.utils';
@Resolver('User')
export class UserResolver {
  constructor(
    private userService: UserService,
    private organisationService: OrganisationService,
    private userauthService: UserauthService,
  ) {}

  @Permissions(PermissionsType.EditUser)
  @Mutation()
  async updateUserGroups(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('input')
    userInput: UpdateUserGroupInput,
  ): Promise<Group[]> {
    return this.userService.updateUserGroups(id, userInput);
  }

  // @Permissions(PermissionsType.EditUser)
  // @Mutation()
  // async updateUserPermissions(
  //   @Args('id', ParseUUIDPipe) id: string,
  //   @Args('input')
  //   userInput: UpdateUserPermissionInput,
  // ): Promise<Permission[]> {
  //   return this.userService.updateUserPermissions(id, userInput);
  // }

  // needs modification to handle multi tenancy. Function not using
  // permission check should perform against tenant/organisation subscription as well
  @Permissions(PermissionsType.EditUser)
  @Query()
  async verifyUserPermission() {
    // @Args('params') params: UserPermissionsVerification, // @Args('id', ParseUUIDPipe) id: string,
    // const { status } = await this.userService.verifyUserPermissions(
    //   id,
    //   params.permissions,
    //   params.operation || OperationType.AND,
    // );
    return false;
  }

  @Permissions(PermissionsType.ViewUser)
  @Query()
  async getUserPermissions(
    @Args('id', ParseUUIDPipe) id: string,
  ): Promise<Permission[]> {
    return this.userService.getUserPermissions(id);
  }

  @Permissions(PermissionsType.ViewUser)
  @Query()
  async getUserGroups(
    @Args('id', ParseUUIDPipe) id: string,
  ): Promise<Permission[]> {
    return this.userService.getUserGroups(id);
  }

  @UseAuthGuard(AuthTarget.User)
  @Query()
  async getAllPermissionsOfUser(
    @Context('user') user: any,
  ): Promise<Permission[]> {
    return this.userService.getAllPermissionsOfUser(user);
  }

  @Permissions(PermissionsType.CustomerCreateUsers)
  @Mutation()
  async createUserWithRole(
    @Context('user') user: any,
    @Args('input')
    input: CreateUserWithRoleInput,
  ): Promise<User> {
    input = await validate(CreateUserWithRoleValidator, input);
    // TODO check permission based on group input
    return this.userService.createUserWithRole(input, user);
  }

  @Permissions(PermissionsType.CustomerEditUsers)
  @Mutation()
  async editUserRoles(
    @Context('user') user: AccessTokenData,
    @Args('input')
    input: EditUserRolesInput,
  ): Promise<StatusResponse> {
    return this.userService.editUserRoles(input, user);
  }

  @UseAuthGuard(AuthTarget.User)
  @Mutation()
  async updateUserProfile(
    @Context('user') user: AccessTokenData,
    @Args('input')
    input: UpdateUserInput,
  ): Promise<User> {
    input = await validate(UpdateUserSchema, input);
    return this.userService.updateUserProfile(input, user);
  }

  @ResolveField()
  async nationality(
    @Parent() user: User,
    @InjectLoader({
      fromEntity: Country,
    })
    loader: DataLoader<string, Country>,
  ) {
    const country = user.countryId ? await loader.load(user.countryId) : null;
    return country?.name;
  }

  @Permissions(
    PermissionsType.CustomerViewUsers,
    PermissionsType.CustomerActivateUsers,
  )
  @Query()
  async getUsers(
    @Context('user') user: any,
    @Args('input') input: GetUsersFilterInput,
  ) {
    return this.userService.getUsers(user, input);
  }

  @Permissions(PermissionsType.CustomerViewUsers)
  @Query()
  async getUserAssetCount(
    @Context('user') user: AccessTokenData,
    @Args('id') userId: string,
  ): Promise<GetUserAssetsCountOutput> {
    const assets = await this.userService.getUserAssetCount(
      userId,
      user.organisation.id,
    );
    return { assets };
  }

  @UseAuthGuard(AuthTarget.User)
  @Query()
  async getUserProfile(@Context('user') user: AccessTokenData): Promise<User> {
    return this.userService.getUserProfile(user.id);
  }

  @UseAuthGuard(AuthTarget.User)
  @Mutation('updateEmail')
  async updateEmail(
    @Args('email') email: string,
    @Args('newEmail') newEmail: string,
    @Args('singpass') singpass: boolean,
  ): Promise<ObjectLiteral> {
    const resp = await this.userService.updateEmail(email, newEmail, singpass);
    return resp;
  }

  @UseAuthGuard(AuthTarget.User)
  @Mutation('switchOrganisation')
  async switchOrganisation(
    @Context('res') response: Response,
    @Args('input') input: SwitchOrganisationInput,
    @Context('user') user: AccessTokenData,
  ): Promise<AuthOutput> {
    return await this.userService.switchOrganisation(input, user, response);
  }

  @ResolveField()
  async organisation(@Context('user') user: AccessTokenData) {
    return user?.organisation?.id
      ? await this.organisationService.getOrganisation(user)
      : null;
  }

  @ResolveField()
  async activeUserOrganisations(
    @Parent() user: User,
    @InjectLoader({
      fromEntity: UserOrganisation,
      resolveType: 'many',
      fieldName: 'userId',
      resolveInput: {
        relations: ['organisation'],
        where: { status: UserOrganisationStatus.Active },
      },
    })
    loader: DataLoader<string, UserOrganisation[]>,
  ) {
    return await loader.load(user.id);
  }

  @ResolveField()
  async rolePermissions(@Context('user') user: AccessTokenData) {
    return user?.organisation?.id
      ? await this.userService.getAllGroupPermissionsOfUser(
          user.id,
          user.organisation.id,
        )
      : [];
  }

  @ResolveField()
  async planPermissions(@Context('user') user: AccessTokenData) {
    return user?.organisation?.id
      ? await this.userService.getAllOrgPermissions(user.organisation.id)
      : [];
  }

  @ResolveField()
  async userGroup(
    @Parent() user: User,
    @Context('user') authUser: AccessTokenData,
    @InjectLoader({
      fromEntity: UserGroup,
      resolveType: 'many',
      fieldName: 'userId',
      resolveInput: {
        relations: ['group'],
      },
    })
    loader: DataLoader<string, UserGroup[]>,
  ) {
    return authUser.organisation?.id
      ? (await loader.load(user.id))
          ?.filter(
            (userGroup) =>
              userGroup.organisationId === authUser.organisation?.id,
          )
          // Sorting based on group name order in the CustomerGroupType. Later will remove when restricted to only one group
          .sort((a, b) => {
            return (
              getEnumIndex(CustomerGroupType, a?.group?.name || '') -
              getEnumIndex(CustomerGroupType, b?.group?.name || '')
            );
          })
      : [];
  }
}
