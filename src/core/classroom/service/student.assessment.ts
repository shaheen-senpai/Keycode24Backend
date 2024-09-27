import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import StudentAssessment from '../entity/student.assesment.entity';
import { BaseService } from 'src/common/utils/base.service';
import UserService from 'src/core/authorization/service/user.service';
import { AssessmentService } from './assessment.service';

@Injectable()
export class StudentAssessmentService extends BaseService<StudentAssessment> {
  constructor(
    @InjectRepository(StudentAssessment)
    private studentAssessmentRepository: Repository<StudentAssessment>,
    private userService: UserService,
    private assessmentService: AssessmentService,
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
}
