import { InjectLoader } from '@keyvaluesystems/nestjs-dataloader';
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
import DataLoader from 'dataloader';
import { validate } from '../../../common/utils/validation.utils';
import {
  AccessTokenData,
  PermissionsType,
} from '../../../core/authorization/constants/authorization.constants';
import Country from '../../../core/authorization/entity/country.entity';
import Organisation from '../../../core/authorization/entity/organisation.entity';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import OrganisationService from '../../../core/authorization/service/organisation.service';
import { UpdateOrganisationInputValidation } from '../../../core/authorization/validation/organisation.validation.schema';
import {
  CreateOrganisationInput,
  UpdateOrganisationInput,
  UpdateOrganisationMfaInput,
} from '../../schema/graphql.schema';
import { UseAuthGuard } from '../../../core/authentication/authentication.decarator';
import { AuthTarget } from '../../../core/authentication/constants/authentication.constants';

@Resolver('Organisation')
export class OrganisationResolver {
  constructor(private organisationService: OrganisationService) {}

  @Permissions(PermissionsType.CustomerViewOrganization)
  @Query()
  async getOrganisation(@Context('user') user: AccessTokenData) {
    return await this.organisationService.getOrganisation(user);
  }

  @UseAuthGuard(AuthTarget.User)
  @Mutation()
  async createOrganisation(
    @Context('res') response: Response,
    @Context('user') user: AccessTokenData,
    @Args('input') input: CreateOrganisationInput,
  ) {
    //TODO: Try parameter validation using Joi to validate countryId also.
    input = await validate(UpdateOrganisationInputValidation, input);
    return await this.organisationService.createOrganisation(
      user,
      input,
      response,
    );
  }

  @Permissions(PermissionsType.CustomerEditOrganization)
  @Mutation()
  async updateOrganisation(
    @Context('user') user: AccessTokenData,
    @Args('input') input: UpdateOrganisationInput,
  ) {
    //TODO: Try parameter validation using Joi to validate countryId also.
    input = await validate(UpdateOrganisationInputValidation, input);
    return await this.organisationService.updateOrganisation(user, input);
  }

  @Permissions(PermissionsType.CustomerViewOrganization)
  @Query()
  getOrganisationIndustries() {
    return this.organisationService.getIndustries();
  }

  @Permissions(PermissionsType.CustomerEditMFA)
  @Mutation()
  async updateOrganisationMfa(
    @Context('user') user: AccessTokenData,
    @Args('input') input: UpdateOrganisationMfaInput,
  ) {
    return await this.organisationService.updateOrganisationMfa(user, input);
  }

  @ResolveField()
  async location(
    @Parent() organisation: Organisation,
    @InjectLoader({
      fromEntity: Country,
    })
    loader: DataLoader<string, Country>,
  ) {
    return organisation.countryId
      ? await loader.load(organisation.countryId)
      : null;
  }

  @ResolveField()
  async isMfaEnabled(@Parent() organisation: Organisation) {
    return (
      (await this.organisationService.getMfaStatus(organisation.id)) || false
    );
  }
}
