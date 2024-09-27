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
import StudentAssessment from '../entity/student.assesment.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AssessmentService extends BaseService<Assessment> {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepository: Repository<StudentAssessment>,
    private questionService: QuestionService,
    private configService: ConfigService,
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
    const assesment = await this.assessmentRepository.findOneOrFail(options);
    const avgScore = await this.getAverageScore(null, assesment.id);
    return { ...assesment, avgScore };
  }

  async createAssessment(
    input: ObjectLiteral,
    user: ObjectLiteral,
  ): Promise<Assessment> {
    const assessmentObj = {
      ...(input.name && { name: input.name }),
      ...(input.gradeId && { gradeId: input.gradeId }),
      ...(input.subjectId && { subjectId: input.subjectId }),
      createdById: user.id,
    };
    const mlInput = {
      questions_data: input.questions.map((item: any) => {
        return {
          question: item.questionText,
          choices: item.options,
          answer: item.answer,
          type: item.type,
          weightage: item.weightage,
        };
      }),
    };
    const mlDomain = this.configService.get('ML_API');
    const result = await axios.post(
      `${mlDomain}/api/assessment/properties`,
      mlInput,
    );
    const output = result.data;
    const assessment = await this.assessmentRepository.save({
      ...assessmentObj,
      level: output.level,
      outcomes: output.outcomes,
      name: output.name,
    });
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
    const assesments = await this.assessmentRepository.find({
      where,
      relations: ['createdBy', 'subject', 'grade'],
    });
    await Promise.all(
      assesments.map(async (assessment) => {
        assessment.avgScore = await this.getAverageScore(null, assessment.id);
      }),
    );
    return assesments;
  }

  async getAverageScore(userId?: string | null, assessmentId?: string | null) {
    const query = this.studentAssessmentRepository
      .createQueryBuilder()
      .select('AVG(score)', 'avgScore');
    userId && query.andWhere('user_id = :userId', { userId });
    assessmentId &&
      query.andWhere('assessment_id = :assessmentId', { assessmentId });
    const averagePrice = await query.getRawOne();
    return averagePrice.avgScore ? parseInt(averagePrice.avgScore) : 0;
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
