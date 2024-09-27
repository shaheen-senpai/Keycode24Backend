import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import StudentAssessment from '../entity/student.assesment.entity';
import { BaseService } from 'src/common/utils/base.service';
import UserService from 'src/core/authorization/service/user.service';
import { AssessmentService } from './assessment.service';
import { QuestionService } from './question.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class StudentAssessmentService extends BaseService<StudentAssessment> {
  constructor(
    @InjectRepository(StudentAssessment)
    private studentAssessmentRepository: Repository<StudentAssessment>,
    private userService: UserService,
    private assessmentService: AssessmentService,
    private questionService: QuestionService,
    private configService: ConfigService,
  ) {
    super(studentAssessmentRepository);
  }

  /**
   * TO save a student assessment record
   * @param studentId
   * @returns Promise<StudentAssessment>
   */
  async saveStudentAssessment(
    studentId: string,
    assesmentId: string,
    score: number,
  ): Promise<StudentAssessment> {
    const student = await this.userService.getUserProfile(studentId);
    const assessment = await this.assessmentService.getAssessmentById({
      where: { id: assesmentId },
    });
    const studentAssessment = new StudentAssessment();
    studentAssessment.userId = studentId;
    studentAssessment.user = student;
    studentAssessment.assessmentId = assesmentId;
    studentAssessment.assessment = assessment;
    studentAssessment.score = score;
    return this.studentAssessmentRepository.save(studentAssessment);
  }

  /**
   * to calculate the score of each questions in assessment
   * @param questions
   * @returns Promise<{ score: number; assessmentId: string }>
   */
  async calculateScore(questions: [{ id: string; userAnswer: string }]) {
    let score = 0;
    let assessmentId = '';
    const mlDomain = this.configService.get('ML_API');
    await Promise.all(
      questions.map(async (question) => {
        const questionData = await this.questionService.findOneOrFail({
          where: { id: question.id },
        }); // get question data
        assessmentId = questionData.assessmentId || '';
        if (
          questionData.type &&
          ['MCQ', 'Assertion-Reason', 'True-False'].includes(questionData.type)
        ) {
          if (questionData.answer === question.userAnswer) {
            score += questionData.weightage || 0;
          }
        } else if (questionData.type === 'Short-Answer') {
          const mlInput = {
            question: questionData.questionText,
            answer: question.userAnswer,
            type: questionData.type,
            total_score: 100,
          };
          const { data } = await axios.post(
            `${mlDomain}/api/assessment/score`,
            mlInput,
          );
          score += data.score;
        } else {
          const mlInput = {
            question: questionData.questionText,
            answer: question.userAnswer,
            type: questionData.type,
            total_score: questionData.weightage,
          };
          const { data } = await axios.post(
            `${mlDomain}/api/assessment/score`,
            mlInput,
          );
          score += data.score;
        }
      }),
    );
    return { score, assessmentId };
  }
}
