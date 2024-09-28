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
  async calculateScore(questions: any) {
    let score = 0;
    let assessmentId = '';
    let totalScore = 0;
    const mlDomain = this.configService.get('ML_API');
    const mcqRef = {'a': 0, 'b': 1, 'c': 2, 'd': 3};
    await Promise.all(
      questions.map(async (question: any) => {
        const questionData = await this.questionService.findOneOrFail({
          where: { id: question.id },
        }); // get question data
        question.questionText = questionData.questionText;
        question.options = questionData.options;
        question.answer = questionData.answer;
        question.assessmentId = questionData.assessmentId;
        question.type = questionData.type;
        question.weightage = questionData.weightage;
        question.score = 0;
        totalScore = totalScore + (parseInt(questionData.weightage || '0'));
        assessmentId = questionData.assessmentId || '';
        if (
          questionData.type &&
          ['True-False'].includes(questionData.type)
        ) {
          if (questionData.answer === question.userAnswer) {
            question.score = 100;
            score += parseInt(questionData.weightage || '0');
          }
        }else if(questionData.type && ['MCQ', 'Assertion-Reason'].includes(questionData.type)){
          const answer = questionData.options?.[mcqRef?.[questionData.answer as 'a' | 'b'] || 0];
          if (answer === question.userAnswer) {
            question.score = 100;
            score += parseInt(questionData.weightage || '0');
          }
        } else {
          const mlInput = {
            question: questionData.questionText,
            answer: question.userAnswer,
            type: questionData.type,
            total_score: questionData.weightage,
          };
          let data = null;
          try{
            const resp = await axios.post(
              `${mlDomain}/api/score`,
              mlInput,
            );
            data = resp.data;
          } catch (error) {
            console.log('Error in ML API', error);
          }
          score += data?.score || 40;
          question.score = data?.score || 40;
          question.mlData = data;
        }
      }),
    );

    return { score: Math.round(score*100/totalScore), assessmentId };
  }
}
