import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from './entity/user.entity';
import Grade from './entity/grade.entity';
import Subject from './entity/subject.entity';
import SubjectGrade from './entity/subject.grade.entity';
import UserGrade from './entity/user.grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Grade, Subject, SubjectGrade, UserGrade]),
  ],
  providers: [],
  exports: [],
})
export class AuthorizationModule {}
