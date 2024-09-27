import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FindOptionsWhere } from 'typeorm';

import UserLinkedAccounts from '../../../core/authorization/entity/user.linked.accounts.entity';
import {
  AccessTokenData,
  PermissionsType,
} from '../../../core/authorization/constants/authorization.constants';
import { UserLinkedAccountsService } from '../../../core/authorization/service/userLinkedAccounts.service';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import {
  GetUserLinkedAccountsOutput,
  StatusResponse,
  UpdateUserLinkedAccountInput,
  GetLinkedAccountsInput,
} from '../../schema/graphql.schema';

@Resolver('UserLinkedAccounts')
export class UserLinkedAccountsResolver {
  constructor(private userLinkedAccountsService: UserLinkedAccountsService) {}

  @Permissions([
    PermissionsType.CustomerViewMergeIntegration,
    PermissionsType.CustomerViewGoogleCalendarIntegration,
  ])
  @Query()
  async getLinkedAccounts(
    @Context('user') user: AccessTokenData,
    @Args('input') input: GetLinkedAccountsInput,
  ): Promise<GetUserLinkedAccountsOutput> {
    return await this.userLinkedAccountsService.getLinkedAccounts(input, user, {
      organisationId: user.organisation.id,
    });
  }

  @Permissions([
    PermissionsType.CustomerCreateMergeIntegrationLimit1,
    PermissionsType.CustomerCreateMergeIntegrationLimitLast,
    PermissionsType.CustomerEditGoogleCalendarIntegration,
  ])
  @Mutation()
  async updateUserLinkedAccount(
    @Context('user') user: AccessTokenData,
    @Args('id') id: string,
    @Args('input') input: UpdateUserLinkedAccountInput,
  ): Promise<StatusResponse> {
    // !hasPermission(
    //   user,
    //   PermissionsType.CustomerEditGoogleCalendarIntegration,
    // ) && (await this.userLinkedAccountsService.resourceLimitValidation(user));
    const where: FindOptionsWhere<UserLinkedAccounts> = {
      id,
      organisationId: user.organisation.id,
    };
    return await this.userLinkedAccountsService.update(where, input, user);
  }

  @Permissions([PermissionsType.CustomerDeleteMergeIntegration])
  @Mutation()
  async deleteLinkedAccount(
    @Context('user') user: AccessTokenData,
    @Args('id') id: string,
  ): Promise<StatusResponse> {
    const where: FindOptionsWhere<UserLinkedAccounts> = {
      id,
      organisationId: user.organisation.id,
    };
    return await this.userLinkedAccountsService.delete(where, user);
  }
}
