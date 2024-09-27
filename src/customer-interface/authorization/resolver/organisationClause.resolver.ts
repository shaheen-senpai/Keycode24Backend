import { Args, Context, Mutation, Resolver, Query } from '@nestjs/graphql';
import { validate } from '../../../common/utils/validation.utils';
import OrganisationClause from '../../../core/authorization/entity/organisationClause.entity';
import { UpdateOrganisationClauseSchema } from '../../../core/authorization/validation/organisation.clause.validation.schema';
import {
  AccessTokenData,
  PermissionsType,
} from '../../../core/authorization/constants/authorization.constants';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import OrganisationClauseService from '../../../core/authorization/service/organisation.clause.service';
import {
  StatusResponse,
  UpdateOrganisationClauseInput,
} from '../../schema/graphql.schema';

@Resolver('OrganisationClause')
export class OrganisationClauseResolver {
  constructor(private organisationClauseService: OrganisationClauseService) {}

  @Permissions(PermissionsType.CustomerViewBrand)
  @Query()
  async getOrganisationClauses(
    @Context('user') user: AccessTokenData,
  ): Promise<OrganisationClause[]> {
    return await this.organisationClauseService.getOrganisationClauses({
      organisationId: user.organisation.id,
    });
  }

  @Permissions([
    PermissionsType.CustomerCreateBrand,
    PermissionsType.CustomerEditBrand,
  ])
  @Mutation()
  async updateOrganisationClause(
    @Context('user') user: AccessTokenData,
    @Args('input') input: UpdateOrganisationClauseInput,
  ): Promise<OrganisationClause> {
    await validate(UpdateOrganisationClauseSchema, input);
    return await this.organisationClauseService.updateOrganisationClause(
      user,
      input,
    );
  }

  @Permissions(PermissionsType.CustomerDeleteBrand)
  @Mutation()
  async deleteOrganisationClause(
    @Context('user') user: AccessTokenData,
    @Args('id') id: string,
  ): Promise<StatusResponse> {
    return await this.organisationClauseService.deleteOrganisationClause({
      organisationId: user.organisation.id,
      id,
    });
  }
}
