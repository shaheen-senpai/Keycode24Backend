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
import Subject from '../entity/subject.entity';
import { SubjectNotFoundException } from '../exception/subject.exception';

@Injectable()
export class SubjectService extends BaseService<Subject> {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {
    super(subjectRepository);
  }

  /**
   * To get a Subject by id
   * @param id
   * @param entityManager
   * @returns Subject
   */
  async getSubjectById(
    id: string,
    entityManager?: EntityManager,
  ): Promise<Subject> {
    const subjectRepo = entityManager
      ? entityManager.getRepository(Subject)
      : this.subjectRepository;
    const subject = await subjectRepo.findOneBy({ id });
    if (subject) {
      return subject;
    }
    throw new SubjectNotFoundException(id);
  }

  /**
   * Finds a subject using the given conditions.
   * @param queryObj query object to find the subject
   * @returns Subject
   */
  async findOne(queryObj: FindOneOptions<Subject>): Promise<Subject | null> {
    return await this.subjectRepository.findOne(queryObj);
  }

  /**
   * Find one subject using given conditions
   * @param query
   * @param errorMessage message to throw in error
   * @returns Subject
   */
  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<Subject> | string,
    errorMessage?: string,
  ): Promise<Subject> {
    return await super.findOneOrFail(query, errorMessage);
  }

  /**
   * Function to save the subject or list of subjects
   * @param subject
   */
  public async save(
    subject: Subject | Subject[],
  ): Promise<Subject | Subject[]> {
    const out = await this.subjectRepository.save(
      Array.isArray(subject) ? subject : [subject],
    );
    return Array.isArray(subject) ? out : out[0];
  }

  /**
   * Get subject by given condition.
   * @param where Condition against subject table
   * @param relations Relations to be fetched
   * @returns subject object or null
   */
  async getSubjectByCondition(
    where: FindOptionsWhere<Subject>,
    relations?: string[],
  ): Promise<Subject | null> {
    return this.subjectRepository.findOne({
      where,
      relations,
    });
  }

  /**
   * Function to get or create a subject
   * @param subject subject object
   * @returns subject object
   * @throws SubjectNotFoundException
   */
  async getOrCreateSubject(subject: Subject): Promise<Subject> {
    const existingSubject = await this.findOneOrFail({ name: subject.name });
    if (existingSubject) {
      return existingSubject;
    }
    return await this.subjectRepository.save(subject);
  }

  /**
   * function to create a subject
   * @param name name of the subject
   * @param file file object
   * @returns subject object
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(name: string, file: Express.Multer.File) {
    // Handle the file and input data here
    // For example, save the file to the filesystem or a database
  }

  /**
   * Function to get all subjects
   * @returns list of subjects
   *
   */
  async getAllSubjects(): Promise<Subject[]> {
    return await this.subjectRepository.find();
  }
}
