import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import {
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import Assessment from '../entity/assessment.entity';

@Injectable()
export class AssessmentService extends BaseService<Assessment> {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
  ) {
    super(assessmentRepository);
  }

  /**
   * To get a Grade by id
   * @param id
   * @param entityManager
   * @returns Grade
   */
  async getAssessmentById(
    options: FindOneOptions<Assessment>,
  ): Promise<Assessment> {
    return await this.assessmentRepository.findOneOrFail(options);
  }

  /**
   * Finds a grade using the given conditions.
   * @param queryObj query object to find the grade
   * @returns Grade
   */
  async findOne(
    queryObj: FindOneOptions<Assessment>,
  ): Promise<Assessment | null> {
    return await this.assessmentRepository.findOne(queryObj);
  }

  /**
   * Find one grade using given conditions
   * @param query
   * @param errorMessage message to throw in error
   * @returns Grade
   */
  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<Assessment> | string,
    errorMessage?: string,
  ): Promise<Assessment> {
    return await super.findOneOrFail(query, errorMessage);
  }

  /**
   * Function to save the grade or list of grades
   * @param grade
   */
  public async save(
    grade: Assessment | Assessment[],
  ): Promise<Assessment | Assessment[]> {
    const out = await this.assessmentRepository.save(
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
  async getAllAssessments(
    where: FindOptionsWhere<Assessment>,
  ): Promise<Assessment[]> {
    return await this.assessmentRepository.find({ where });
  }
}
