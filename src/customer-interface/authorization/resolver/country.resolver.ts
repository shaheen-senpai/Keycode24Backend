import { UseGuards } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../../../core/authentication/authentication.guard';
import { AccessTokenData } from '../../../core/authorization/constants/authorization.constants';
import CountryService from '../../../core/authorization/service/country.service';
import { GetCountriesInput } from '../../schema/graphql.schema';

@Resolver()
export class CountryResolver {
  constructor(private countryService: CountryService) {}

  @UseGuards(AuthGuard)
  @Query()
  async getCountries(
    @Args('input') input: GetCountriesInput,
    @Context('user') user: AccessTokenData,
  ) {
    return await this.countryService.getCountries(input, user);
  }
}
