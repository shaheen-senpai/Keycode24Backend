import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import { Repository } from 'typeorm';
import SubjectGrade from '../entity/subject.grade.entity';
import Subject from '../entity/subject.entity';

@Injectable()
export class SubjectGradeService extends BaseService<SubjectGrade> {
  constructor(
    @InjectRepository(SubjectGrade)
    private readonly subjectGradeRepository: Repository<SubjectGrade>,
  ) {
    super(subjectGradeRepository);
  }

  /**
   * Get all subjects associated with a specific grade
   * @param gradeId The ID of the grade
   * @returns An array of subjects
   */
  async getAllSubjectsByGradeId(gradeId: string): Promise<Subject[]> {
    const subjectGrades = await this.subjectGradeRepository.find({
      where: { gradeId },
      relations: ['subject'],
    });

    // Map the subject grades to extract the subjects
    const subjects = subjectGrades
      .map((subjectGrade) => subjectGrade.subject)
      .filter((subject) => subject !== undefined);

    return subjects;
  }
}
