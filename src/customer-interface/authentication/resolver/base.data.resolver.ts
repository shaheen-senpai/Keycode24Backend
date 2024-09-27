import { ResolveField, Resolver } from '@nestjs/graphql';
import CountryService from '../../../core/authorization/service/country.service';
import { Query } from '@nestjs/graphql';
import {
  Industry,
  UserOrganisationRole,
} from '../../../core/authorization/constants/onboarding.constants';
import { CountRangeResolver } from '../enum/count.range.enum';

@Resolver('BaseData')
export class BaseDataResolver {
  constructor(private countryService: CountryService) {}

  @Query()
  async getBaseData() {
    return {};
  }

  @ResolveField()
  async countries() {
    return await this.countryService.getCountries();
  }

  @ResolveField()
  userOrganisationRoles() {
    return Object.values(UserOrganisationRole);
  }

  @ResolveField()
  industries() {
    return Object.values(Industry);
  }

  @ResolveField()
  countRange() {
    return Object.values(CountRangeResolver);
  }
}
