import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { AccessTokenData } from '../constants/authorization.constants';
import {
  OrganisationClauseType,
  StatusResponse,
  UpdateOrganisationClauseInput,
} from '../../../customer-interface/schema/graphql.schema';
import OrganisationClause from '../entity/organisationClause.entity';
import { EnableLog } from '../logging.decorator';
import { BaseService } from '../../../common/utils/base.service';

@Injectable()
export default class OrganisationClauseService extends BaseService<OrganisationClause> {
  constructor(
    @InjectRepository(OrganisationClause)
    private organisationClauseRepository: Repository<OrganisationClause>,
  ) {
    super(organisationClauseRepository);
  }

  /**
   * Finds organisation clause with user's organisation id.
   * @param user user access token data
   * @returns Organisation Clause
   */
  @EnableLog()
  async getOrganisationClauses(
    where: FindOptionsWhere<OrganisationClause>,
  ): Promise<OrganisationClause[]> {
    const organisationClauses = await this.organisationClauseRepository.findBy(
      where,
    );
    return organisationClauses;
  }

  /**
   * Update Organisation Clause
   * @param user user access token data
   * @param input { id - organisationClauseId, type: OrganisationClauseType, htmlText }
   * @returns Updated organisation clause details
   */
  @Transactional()
  @EnableLog()
  async updateOrganisationClause(
    user: AccessTokenData,
    input: UpdateOrganisationClauseInput,
  ): Promise<OrganisationClause> {
    const organisationClause: OrganisationClause = input.id
      ? await this.findOneOrFail(
          {
            where: {
              id: input.id,
              organisationId: user.organisation.id,
            },
          },
          `${input.type} not found`,
        )
      : ({
          organisationId: user.organisation.id,
          type: input.type,
        } as OrganisationClause);
    organisationClause.htmlText = input.htmlText;
    organisationClause.htmlHeight = input.htmlHeight;
    return await this.organisationClauseRepository.save(organisationClause);
  }

  /**
   * Delete Organisation Clause
   * @param where
   */
  @Transactional()
  @EnableLog()
  async deleteOrganisationClause(
    where: FindOptionsWhere<OrganisationClause>,
  ): Promise<StatusResponse> {
    const organisationClause: OrganisationClause = await this.findOneOrFail(
      {
        where,
      },
      where.type && `${where.type} not found`,
    );
    await this.organisationClauseRepository.remove(organisationClause);
    return {
      message: 'OK',
    };
  }

  /**
   * To get header and footer of an organisation
   * @param organisationId - ID of the organisation
   * @returns header and footer content if exists
   */
  public async getHeaderFooter(organisationId: string | undefined): Promise<{
    header: OrganisationClause | undefined;
    footer: OrganisationClause | undefined;
  }> {
    if (!organisationId) return { header: undefined, footer: undefined };
    const organisationClause = await this.getOrganisationClauses({
      organisationId,
    });
    const header = organisationClause.find(
      (clause: OrganisationClause) =>
        clause.type === OrganisationClauseType.Header,
    );
    const footer = organisationClause.find(
      (clause: OrganisationClause) =>
        clause.type === OrganisationClauseType.Footer,
    );
    return { header, footer };
  }
}
