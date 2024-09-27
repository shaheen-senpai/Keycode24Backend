import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import {
  FindOneOptions,
  FindOptionsWhere,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import Assessment from '../entity/assessment.entity';
import { QuestionService } from './question.service';
import Question from '../entity/question.entity';

@Injectable()
export class AssessmentService extends BaseService<Assessment> {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    private questionService: QuestionService,
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

  async createAssessment(
    input: ObjectLiteral,
    user: ObjectLiteral,
  ): Promise<Assessment> {
    const assessmentObj = {
      ...(input.name && { name: input.name }),
      ...(input.gradeId && { gradeId: input.gradeId }),
      ...(input.subjectId && { subjectId: input.subjectId }),
      ...(input.level && { level: input.level }),
      ...(input.outcomes.length && { outcomes: input.outcomes }),
      createdById: user.id,
    };
    const assessment = await this.assessmentRepository.save(assessmentObj);
    await this.updateAssessmentQuestions(assessment, input.questions);
    return assessment;
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
    return await this.assessmentRepository.find({ where, relations: ['createdBy', 'subject', 'grade'] });
  }

  public async updateAssessmentQuestions(
    assessment: Assessment,
    questions: Array<ObjectLiteral>,
  ) {
    const currentQuestions = await this.questionService.find({
      where: {
        assessmentId: assessment.id,
      },
    });
    const questionsToBeDeleted = currentQuestions.filter(
      (currentItem: Question) =>
        !questions.some(
          (newItem: ObjectLiteral) =>
            newItem.questionText === currentItem.questionText,
        ),
    );
    const questionsTobeCreated = questions.filter(
      (newItem: ObjectLiteral) =>
        !currentQuestions.some(
          (currentItem: Question) =>
            newItem.questionText === currentItem.questionText,
        ),
    );
    questionsToBeDeleted &&
      (await this.questionService.delete({
        id: In(questionsToBeDeleted.map((item) => item.id)),
      }));
    questionsTobeCreated &&
      (await this.questionService.insert(
        questionsTobeCreated.map((item) => {
          return {
            assessmentId: assessment.id,
            questionText: item.questionText,
            options: item.options,
            answer: item.answer,
            type: item.type,
            weightage: item.weightage,
          } as unknown as Question;
        }),
      ));
  }
}
