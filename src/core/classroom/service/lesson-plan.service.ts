import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import UserService from 'src/core/authorization/service/user.service';
import { SubjectService } from 'src/core/classroom/service/subject.service';
import LessonPlan from '../entity/lesson.plan.entity';
import { FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

@Injectable()
export class LessonPlanService extends BaseService<LessonPlan> {
  constructor(
    @InjectRepository(LessonPlan)
    private readonly lessonPlanRepository: Repository<LessonPlan>,
    private userService: UserService,
    private subjectService: SubjectService,
  ) {
    super(lessonPlanRepository);
  }

  /**
   * To get a LessonPlan by id
   * @param id
   * @param entityManager
   * @returns LessonPlan
   */
  async getLessonPlanById(
    options: FindOneOptions<LessonPlan>,
  ): Promise<LessonPlan> {
    return await this.lessonPlanRepository.findOneOrFail(options);
  }

  /**
   * Function to create a lesson plan
   * @param data a json object containing the lesson plan data
   * @param name the name of the lesson plan
   * @param subjectId the id of the subject
   * @param userId the id of the user creating the lesson plan
   * @returns LessonPlan
   */
  async createLessonPlan(
    data: ObjectLiteral,
    name: string,
    subjectId: string,
    userId: string,
  ): Promise<LessonPlan> {
    const lessonPlanObj = new LessonPlan();
    lessonPlanObj.name = name;
    const user = await this.userService.getUserProfile(userId);
    lessonPlanObj.createdBy = user;
    lessonPlanObj.createdById = userId;
    const subject = await this.subjectService.getSubjectById(subjectId);
    lessonPlanObj.subject = subject;
    lessonPlanObj.subjectId = subjectId;
    lessonPlanObj.data = data;
    return await this.lessonPlanRepository.save(lessonPlanObj);
  }

  /**
   * Get all lesson plans for a user
   * @param userId the id of the user
   */
  async getLessonPlansByUser(userId: string): Promise<LessonPlan[]> {
    return await this.lessonPlanRepository.find({
      where: { createdById: userId },
    });
  }
}
