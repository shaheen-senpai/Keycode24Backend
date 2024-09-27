import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import OrganisationMultiFactorAuth from '../entity/organisation.multiFactorAuth.entity';
import { BaseService } from 'src/common/utils/base.service';

@Injectable()
export class OrganisationMultiFactorAuthService extends BaseService<OrganisationMultiFactorAuth> {
  constructor(
    @InjectRepository(OrganisationMultiFactorAuth)
    private organisationMultiFactorAuthRepo: Repository<OrganisationMultiFactorAuth>,
  ) {
    super(organisationMultiFactorAuthRepo);
  }

  async findOne(
    queryObj: ObjectLiteral | FindOneOptions<OrganisationMultiFactorAuth>,
  ): Promise<OrganisationMultiFactorAuth | null> {
    return await super.findOne(queryObj);
  }

  public async save(
    organisationMfa:
      | OrganisationMultiFactorAuth
      | DeepPartial<OrganisationMultiFactorAuth>,
  ): Promise<OrganisationMultiFactorAuth> {
    return await this.organisationMultiFactorAuthRepo.save(organisationMfa);
  }
}
