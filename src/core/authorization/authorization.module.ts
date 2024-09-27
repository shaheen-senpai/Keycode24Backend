import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from './entity/user.entity';
import UserService from './service/user.service';
import { AuthenticationHelper } from './service/authentication.helper';
import { UserController } from './controller/user.controller';
import { ConfigModule } from '@nestjs/config';
import { ClassroomModule } from '../classroom/classroom.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule, forwardRef(() => ClassroomModule)],
  providers: [UserService, AuthenticationHelper],
  controllers: [UserController],
  exports: [AuthenticationHelper, UserService],
})
export class AuthorizationModule {}
