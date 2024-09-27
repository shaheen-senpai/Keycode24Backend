import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Raw, Repository } from 'typeorm';
import {
  GetCountriesInput,
  TemplateState,
  TemplateType,
} from '../../../customer-interface/schema/graphql.schema';
import { AccessTokenData } from '../constants/authorization.constants';
import Country from '../entity/country.entity';
import { BaseService } from '../../../common/utils/base.service';

@Injectable()
export default class CountryService extends BaseService<Country> {
  constructor(
    @InjectRepository(Country)
    private countryRepo: Repository<Country>,
  ) {
    super(countryRepo);
  }

  /**
   * To get the list of countries.
   * Can be filtered based on input conditions
   * @param input conditions to filter the countries.
   * @returns List of countries
   */
  async getCountries(input?: GetCountriesInput, user?: AccessTokenData) {
    const queryObj: FindManyOptions<Country> = { order: { name: 'ASC' } };
    if (input?.templateType) {
      const templateType =
        input.templateType === TemplateType.Master
          ? TemplateType.Master
          : TemplateType.UserLibrary;
      user &&
        (queryObj.where = {
          id: Raw(
            () =>
              `id IN 
            (SELECT country_id FROM template_country tc
              INNER JOIN template t ON t.id = tc.template_id 
              WHERE tc.deleted_at IS NULL AND t.deleted_at IS NULL AND t.record_type = ${parseInt(
                input.recordType,
              )} AND t.type = '${templateType}'
              ${
                //Now the else case is considered as 'UserLibrary'. When more types come, need to handle separatly
                templateType === TemplateType.Master
                  ? `AND t.state = '${TemplateState.Published}'`
                  : `AND t.organisation_id = '${user.organisation.id}' AND t.created_by_id = '${user.id}'`
              }
            )`,
          ),
        });
    }
    const countries = await this.countryRepo.find(queryObj);
    return countries;
  }

  /**
   * To get Countries their id's
   * @param ids
   * @returns List of countries
   */
  async getCountriesByIds(ids: string[]) {
    return await this.countryRepo.findBy({ id: In(ids) });
  }
}
