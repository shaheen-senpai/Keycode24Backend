import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import UserGrade from './entity/user.grade.entity';
import SubjectGrade from './entity/subject.grade.entity';
import Subject from './entity/subject.entity';
import Grade from './entity/grade.entity';
import Assessment from './entity/assessment.entity';
import Question from './entity/question.entity';
import Chat from './entity/chat.entity';
import ChatMessage from './entity/chat.message.entity';
import { GradeController } from './controller/grade.controller';
import { GradeService } from './service/grade.service';
import { SubjectGradeService } from './service/subject.grade.service';
import { SubjectService } from './service/subject.service';
import { UserGradeService } from './service/user.grade.service';
import { AssessmentService } from './service/assessment.service';
import { ChatService } from './service/chat.service';
import { ChatMessageService } from './service/chat.message.service';
import { AssessmentController } from './controller/assessment.controller';
import { SubjectController } from './controller/subject.controller';
import { ChatController } from './controller/chat.controller';
import { ChatMessageController } from './controller/chat.message.controller';
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
      Chat,
      ChatMessage,
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
    ChatService,
    ChatMessageService,
  ],
  controllers: [
    GradeController,
    AssessmentController,
    SubjectController,
    ChatController,
    ChatMessageController,
  ],
  exports: [],
})
export class ClassroomModule {}
