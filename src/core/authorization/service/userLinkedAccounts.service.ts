import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
  DeepPartial,
} from 'typeorm';

import { GeneralApplicationException } from '../../../common/exception/general.application.exception';
import {
  GetLinkedAccountsInput,
  LinkedAccountPlatform,
  StatusResponse,
  UpdateUserLinkedAccountInput,
} from '../../../customer-interface/schema/graphql.schema';
import { MergeService } from '../../merge/service/merge.service';
import UserLinkedAccounts from '../entity/user.linked.accounts.entity';
import { BaseService } from '../../../common/utils/base.service';
import {
  GoogleCalendarData,
  UserLinkedDataV1,
} from '../types/userLinkedData.v1';
import { LinkedAccountType } from '../../../admin-interface/schema/graphql.schema';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AccessTokenData } from '../constants/authorization.constants';

@Injectable()
export class UserLinkedAccountsService extends BaseService<UserLinkedAccounts> {
  constructor(
    @InjectRepository(UserLinkedAccounts)
    private userLinkedAccountsRepo: Repository<UserLinkedAccounts>,
    private mergeService: MergeService,
  ) {
    super(userLinkedAccountsRepo);
  }

  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<UserLinkedAccounts> | string,
    errorMessage?: string,
  ): Promise<UserLinkedAccounts> {
    return await super.findOneOrFail(query, errorMessage);
  }

  async findOne(
    queryObj: ObjectLiteral | FindOneOptions<UserLinkedAccounts>,
  ): Promise<UserLinkedAccounts | null> {
    !Object.keys(queryObj).includes('where') &&
      (queryObj = { where: queryObj });
    const result = await this.userLinkedAccountsRepo.findOne(queryObj);
    return result;
  }

  async save(entry: UserLinkedAccounts | DeepPartial<UserLinkedAccounts>) {
    return await this.userLinkedAccountsRepo.save(entry);
  }

  async delete(
    where: FindOptionsWhere<UserLinkedAccounts>,
    user?: AccessTokenData,
  ): Promise<StatusResponse> {
    const linkedAccount = await this.findOneOrFail(
      where,
      'The account to be deleted was not found',
    );
    if (
      linkedAccount.platform !== LinkedAccountPlatform.Merge &&
      user &&
      linkedAccount.userId != user.id
    ) {
      throw new GeneralApplicationException(
        'Unauthorized to perform this action',
        'Unauthorized',
        403,
      );
    }
    linkedAccount.platform === LinkedAccountPlatform.Merge &&
      (await this.mergeService.deleteMergeIntegration(linkedAccount));
    const result = await this.userLinkedAccountsRepo.delete(linkedAccount.id);
    return {
      message:
        result.affected != 1
          ? 'Account could not be deleted properly'
          : 'Account deleted',
    };
  }

  async find(
    input: string[] | FindManyOptions<UserLinkedAccounts> | ObjectLiteral,
  ): Promise<UserLinkedAccounts[]> {
    return await super.find(input);
  }

  async getLinkedAccounts(
    input: GetLinkedAccountsInput,
    user: AccessTokenData,
    where: FindOptionsWhere<UserLinkedAccounts>,
  ) {
    const query = this.userLinkedAccountsRepo.createQueryBuilder();
    this.applyWhere(
      where,
      query,
      this.userLinkedAccountsRepo.metadata,
      'UserLinkedAccounts',
    );
    const filter = input?.filter;
    typeof filter?.isActive === 'boolean' &&
      query.andWhere('UserLinkedAccounts.isActive = :isActive', {
        isActive: filter.isActive,
      });
    filter?.types?.length &&
      query.andWhere('UserLinkedAccounts.type IN (:...types)', {
        types: filter.types,
      });
    if (filter?.platforms?.length) {
      if (filter.platforms.includes(LinkedAccountPlatform.Merge)) {
        query.andWhere(
          '(UserLinkedAccounts.platform = :merge OR (UserLinkedAccounts.platform IN (:...platforms) AND UserLinkedAccounts.userId = :userId))',
          {
            platforms: filter.platforms,
            userId: user.id,
            merge: LinkedAccountPlatform.Merge,
          },
        );
      } else {
        query.andWhere(
          'UserLinkedAccounts.platform IN (:...platforms) AND UserLinkedAccounts.userId = :userId',
          {
            platforms: filter.platforms,
            userId: user.id,
          },
        );
      }
    }
    const linkedAccounts = await query.getMany();
    return { linkedAccounts };
  }

  async update(
    where: FindOptionsWhere<UserLinkedAccounts>,
    input: UpdateUserLinkedAccountInput,
    user: AccessTokenData,
  ) {
    const linkedAccount = await this.findOneOrFail(where);
    if (
      linkedAccount.platform !== LinkedAccountPlatform.Merge &&
      linkedAccount.userId != user.id
    ) {
      throw new GeneralApplicationException(
        'Unauthorized to perform this action',
        'Unauthorized',
        403,
      );
    }
    await this.userLinkedAccountsRepo.update(
      linkedAccount.id,
      input as QueryDeepPartialEntity<UserLinkedAccounts>,
    );
    return {
      message: 'OK',
    };
  }

  async upsertGoogleCalendarAccount(
    userDetails: {
      userId: string;
      organisationId: string;
    },
    refreshToken: string,
  ) {
    const userLinkedAccountEntry = await this.findOne({
      where: {
        ...userDetails,
        platform: LinkedAccountPlatform.Google,
        type: LinkedAccountType.calendar,
      },
    });
    const data: UserLinkedDataV1 = {
      version: 'v1',
      data: { refreshToken } as GoogleCalendarData,
    };
    if (userLinkedAccountEntry) {
      return await this.save({ ...userLinkedAccountEntry, data });
    } else {
      return await this.save({
        ...userDetails,
        platform: LinkedAccountPlatform.Google,
        type: LinkedAccountType.calendar,
        data: data as ObjectLiteral,
        isLinkVerified: true,
      } as UserLinkedAccounts);
    }
  }
}
