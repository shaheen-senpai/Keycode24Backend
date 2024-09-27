import { GeneralApplicationException } from 'src/common/exception/general.application.exception';
import {
  Between,
  EntityMetadata,
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  FindOptionsWhere,
  In,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  AccessTokenData,
  LimitDuration,
  PermissionsType,
} from '../../core/authorization/constants/authorization.constants';
import {
  getLimitPermissionInformation,
  hasPermission,
} from './permission.utils';
import moment from 'moment';

export class BaseService<T extends ObjectLiteral> {
  private readonly repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  sanitizeFindOneQuery(query: ObjectLiteral | FindOneOptions<T> | string) {
    typeof query === 'string' && (query = { where: { id: query } });
    !Object.keys(query).includes('where') && (query = { where: query });
    return query;
  }

  sanitizeFindManyQuery(input: string[] | FindManyOptions<T> | ObjectLiteral) {
    Array.isArray(input) && (input = { where: { id: In(input) } });
    !('where' in input) && (input = { where: input });
    return input;
  }

  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<T> | string,
    errorMessage?: string,
  ): Promise<T> {
    query = this.sanitizeFindOneQuery(query);
    const result = await this.repository.findOne(query);
    if (!result)
      throw new GeneralApplicationException(
        errorMessage ||
          `${this.repository.metadata.name || 'Entity'} not found`,
      );
    return result;
  }

  async find(
    input: string[] | FindManyOptions<T> | ObjectLiteral,
  ): Promise<T[]> {
    input = this.sanitizeFindManyQuery(input);
    return await this.repository.find(input);
  }

  async findOne(
    query: string | FindOneOptions<T> | ObjectLiteral,
  ): Promise<T | null> {
    query = this.sanitizeFindOneQuery(query);
    const result = await this.repository.findOne(query);
    return result;
  }

  async findOrFail(
    input: string[] | FindManyOptions<T> | ObjectLiteral,
    errorMessage?: string,
  ): Promise<T[]> {
    input = this.sanitizeFindManyQuery(input);
    const result = await this.repository.find(input);
    if (!result.length) {
      throw new GeneralApplicationException(
        errorMessage ||
          `${this.repository.metadata.name || 'Entity'} items not found`,
      );
    }
    return result;
  }

  async findAndCount(
    input: string[] | FindManyOptions<T> | ObjectLiteral,
  ): Promise<[T[], number]> {
    input = this.sanitizeFindManyQuery(input);
    const [out, count] = await this.repository.findAndCount(input);
    return [out, count];
  }

  async count(
    query: FindManyOptions<T> | ObjectLiteral | string,
  ): Promise<number> {
    query = this.sanitizeFindOneQuery(query);
    const count = await this.repository.count(query);
    return count;
  }

  async applyWhere(
    where: FindOptionsWhere<T>,
    query: SelectQueryBuilder<T>,
    entityMetadata: EntityMetadata,
    entityName: string,
  ) {
    Object.keys(where).forEach((key) => {
      const columnName = entityMetadata.columns.find(
        (column) => column.propertyName === key,
      )?.databaseName;
      if (columnName) {
        const value = (where as any)[key];
        if (value instanceof FindOperator) {
          const arr = value.value;
          if (Array.isArray(arr)) {
            query.andWhere(`${entityName}.${columnName} IN (:...${key})`, {
              [key]: arr,
            });
          }
        } else {
          query.andWhere(`${entityName}.${columnName} = :${key}`, {
            [key]: value,
          });
        }
      } else {
        const relatedEntityMetadata =
          entityMetadata.findRelationWithPropertyPath(
            key,
          )?.inverseEntityMetadata;

        if (relatedEntityMetadata?.targetName != null) {
          query.leftJoinAndSelect(`${entityName}.${key}`, key);
          this.applyWhere(
            (where as any)[key],
            query,
            relatedEntityMetadata,
            key,
          );
        }
      }
    });
  }

  async resourceLimitValidation(
    user: AccessTokenData,
    where: FindOptionsWhere<T> = {},
    entityName?: string,
  ): Promise<boolean> {
    if (user.inTrial && user.matchedPermissions) {
      user.matchedPermissions = user.matchedPermissions.filter(
        (permission) =>
          permission !== PermissionsType.CustomerCreateContractLimit3,
      );
    }
    const limitPermissions = getLimitPermissionInformation(
      entityName || this.repository.metadata.name,
    )?.sort((a, b) => b.limit - a.limit);
    if (!limitPermissions) {
      throw new GeneralApplicationException(
        'No such limit permission',
        '',
        403,
      );
    }
    let monthlyLimit = 0;
    let lifetimeLimit = 0;
    for (const limitPermission of limitPermissions) {
      const { permission, limit, limitDuration } = limitPermission;
      if (!hasPermission(user, permission)) continue;
      if (limitDuration === LimitDuration.Monthly) {
        monthlyLimit = Math.max(monthlyLimit, limit);
      } else if (limitDuration === LimitDuration.Lifetime) {
        lifetimeLimit = Math.max(lifetimeLimit, limit);
      }
    }
    if (monthlyLimit === Infinity || lifetimeLimit === Infinity) return true;
    let startDate;
    let endDate;
    if (['production', 'stage'].includes(process.env.ENV || '')) {
      startDate = moment().startOf('month').toDate();
      endDate = moment().endOf('month').toDate();
    } else {
      endDate = moment().toDate();
      startDate = moment().subtract(10, 'minutes').toDate();
    }
    const currentLimit = await this.count({
      where: {
        organisationId: user.organisation.id,
        ...(monthlyLimit > 0 && {
          createdAt: Between(startDate, endDate),
        }),
        ...where,
      },
    });
    if (
      (monthlyLimit > 0 && currentLimit < monthlyLimit) ||
      (lifetimeLimit > 0 && currentLimit < lifetimeLimit)
    ) {
      return true;
    }
    throw new GeneralApplicationException(
      'Limit Exceeded',
      `create${entityName || this.repository.metadata.name}:LimitValidation:${
        monthlyLimit > 0 ? `month:${monthlyLimit}` : `lifetime:${lifetimeLimit}`
      }`,
      403,
    );
  }
}
