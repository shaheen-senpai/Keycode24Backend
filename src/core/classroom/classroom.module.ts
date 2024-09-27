import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import UserGrade from './entity/user.grade.entity';
import SubjectGrade from './entity/subject.grade.entity';
import Subject from './entity/subject.entity';
import Grade from './entity/grade.entity';
import Assessment from './entity/assessment.entity';
import Question from './entity/question.entity';

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
    ConfigModule,
  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class ClassroomModule {}
