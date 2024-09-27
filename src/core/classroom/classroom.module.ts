import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import UserGrade from './entity/user.grade.entity';
import SubjectGrade from './entity/subject.grade.entity';
import Subject from './entity/subject.entity';
import Grade from './entity/grade.entity';
import Assessment from './entity/assessment.entity';
import Question from './entity/question.entity';
import Chat from './entity/chat.entity';
import ChatMessage from './entity/chat.message.entity';
import StudentAssessment from './entity/student.assesment.entity';
import LessonPlan from './entity/lesson-plain.entity';

import { GradeService } from './service/grade.service';
import { SubjectGradeService } from './service/subject.grade.service';
import { SubjectService } from './service/subject.service';
import { UserGradeService } from './service/user.grade.service';
import { AssessmentService } from './service/assessment.service';
import { ChatService } from './service/chat.service';
import { ChatMessageService } from './service/chat.message.service';
import { StudentAssessmentService } from './service/student.assessment';
import { LessonPlanService } from './service/lesson-plan.service';

import { GradeController } from './controller/grade.controller';
import { AssessmentController } from './controller/assessment.controller';
import { SubjectController } from './controller/subject.controller';
import { ChatController } from './controller/chat.controller';
import { ChatMessageController } from './controller/chat.message.controller';
import { AuthorizationModule } from '../authorization/authorization.module';
import { QuestionService } from './service/question.service';
import { StudentAssessmentController } from './controller/student.assessment.controller';
import { LessonPlanController } from './controller/lesson-plan.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      Subject,
      SubjectGrade,
      UserGrade,
      Assessment,
      StudentAssessment,
      Question,
      Chat,
      ChatMessage,
      LessonPlan,
    ]),
    forwardRef(() => AuthorizationModule),
    ConfigModule,
  ],
  providers: [
    GradeService,
    SubjectGradeService,
    SubjectService,
    UserGradeService,
    AssessmentService,
    StudentAssessmentService,
    QuestionService,
    ChatService,
    ChatMessageService,
    LessonPlanService,
  ],
  controllers: [
    GradeController,
    AssessmentController,
    StudentAssessmentController,
    SubjectController,
    ChatController,
    ChatMessageController,
    LessonPlanController,
  ],
  exports: [AssessmentService],
})
export class ClassroomModule {}
