import { GeneralApplicationException } from 'src/common/exception/general.application.exception';
import {
  FindManyOptions,
  FindOneOptions,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';

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
}
