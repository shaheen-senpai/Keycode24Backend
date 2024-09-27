import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  AccessTokenData,
  PermissionsType,
} from '../../../core/authorization/constants/authorization.constants';
import {
  ActivateUserOrganisationInput,
  DeleteUserOrganisationInput,
  StatusResponse,
} from '../../schema/graphql.schema';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import UserOrganisationService from '../../../core/authorization/service/user.organisation.service';
import UserOrganisation from 'src/core/authorization/entity/user.organisation.entity';

@Resolver()
export class UserOrganisationResolver {
  constructor(private userOrganisationService: UserOrganisationService) {}

  @Permissions(PermissionsType.CustomerActivateUsers)
  @Mutation()
  async activateUserOrganisation(
    @Args('input') input: ActivateUserOrganisationInput,
    @Context('user') user: AccessTokenData,
  ): Promise<UserOrganisation> {
    const resp = await this.userOrganisationService.activateUserOrganisation(
      input,
      user,
    );
    return resp;
  }

  @Permissions(PermissionsType.CustomerDeleteUsers)
  @Mutation()
  async deleteUserOrganisation(
    @Context('user') user: AccessTokenData,
    @Args('input') input: DeleteUserOrganisationInput,
  ): Promise<StatusResponse> {
    return await this.userOrganisationService.deleteUserOrganisation(
      input,
      user,
    );
  }
}
