import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import UserGrade from './entity/user.grade.entity';
import SubjectGrade from './entity/subject.grade.entity';
import Subject from './entity/subject.entity';
import Grade from './entity/grade.entity';
import Assessment from './entity/assessment.entity';
import Question from './entity/question.entity';
import { GradeController } from './controller/grade.controller';
import { GradeService } from './service/grade.service';
import { SubjectGradeService } from './service/subject.grade.service';
import { SubjectService } from './service/subject.service';
import { UserGradeService } from './service/user.grade.service';
import { AssessmentService } from './service/assessment.service';
import { AssessmentController } from './controller/assessment.controller';
import { AuthorizationModule } from '../authorization/authorization.module';
import { QuestionService } from './service/question.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      Subject,
      SubjectGrade,
      UserGrade,
      Assessment,
      Question,
    ]),
    AuthorizationModule,
    ConfigModule,
  ],
  providers: [
    GradeService,
    SubjectGradeService,
    SubjectService,
    UserGradeService,
    AssessmentService,
    QuestionService,
  ],
  controllers: [GradeController, AssessmentController],
  exports: [],
})
export class ClassroomModule {}
