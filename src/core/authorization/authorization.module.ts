import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from './entity/user.entity';
import Grade from './entity/grade.entity';
import Subject from './entity/subject.entity';
import SubjectGrade from './entity/subject.grade.entity';
import UserGrade from './entity/user.grade.entity';
import UserService from './service/user.service';
import { AuthenticationHelper } from './service/authentication.helper';
import { UserController } from './controller/user.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Grade, Subject, SubjectGrade, UserGrade]),ConfigModule
  ],
  providers: [UserService, AuthenticationHelper],
  controllers: [
    UserController,
  ],
  exports: [],
})
export class AuthorizationModule {}
