import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import {
  EntityManager,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import Grade from '../entity/grade.entity'; // Adjust path accordingly
import { GradeNotFoundException } from '../exception/grade.exception'; // Create this exception

@Injectable()
export class GradeService extends BaseService<Grade> {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
  ) {
    super(gradeRepository);
  }

  /**
   * To get a Grade by id
   * @param id
   * @param entityManager
   * @returns Grade
   */
  async getGradeById(
    id: string,
    entityManager?: EntityManager,
  ): Promise<Grade> {
    const gradeRepo = entityManager
      ? entityManager.getRepository(Grade)
      : this.gradeRepository;
    const grade = await gradeRepo.findOneBy({ id });
    if (grade) {
      return grade;
    }
    throw new GradeNotFoundException(id);
  }

  /**
   * Finds a grade using the given conditions.
   * @param queryObj query object to find the grade
   * @returns Grade
   */
  async findOne(queryObj: FindOneOptions<Grade>): Promise<Grade | null> {
    return await this.gradeRepository.findOne(queryObj);
  }

  /**
   * Find one grade using given conditions
   * @param query
   * @param errorMessage message to throw in error
   * @returns Grade
   */
  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<Grade> | string,
    errorMessage?: string,
  ): Promise<Grade> {
    return await super.findOneOrFail(query, errorMessage);
  }

  /**
   * Function to save the grade or list of grades
   * @param grade
   */
  public async save(grade: Grade | Grade[]): Promise<Grade | Grade[]> {
    const out = await this.gradeRepository.save(
      Array.isArray(grade) ? grade : [grade],
    );
    return Array.isArray(grade) ? out : out[0];
  }

  /**
   * Get grade by given condition.
   * @param where Condition against grade table
   * @param relations Relations to be fetched
   * @returns grade object or null
   */
  async getGradeByCondition(
    where: FindOptionsWhere<Grade>,
    relations?: string[],
  ): Promise<Grade | null> {
    return this.gradeRepository.findOne({
      where,
      relations,
    });
  }

  /**
   * Function to get or create a grade
   * @param grade grade object
   * @returns grade object
   * @throws GradeNotFoundException
   */
  async getOrCreateGrade(grade: Grade): Promise<Grade> {
    const existingGrade = await this.findOneOrFail({ name: grade.name });
    if (existingGrade) {
      return existingGrade;
    }
    return await this.gradeRepository.save(grade);
  }
}
