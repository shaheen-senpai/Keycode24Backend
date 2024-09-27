import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from './entity/user.entity';
import Group from './entity/group.entity';
import Permission from './entity/permission.entity';
import UserRefreshToken from './entity/user.refresh.token.entity';
import UserGroup from './entity/user.group.entity';
import UserPermission from './entity/user.permission.entity';
import GroupPermission from './entity/group.permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      Permission,
      User,
      UserGroup,
      UserPermission,
      GroupPermission,
      UserRefreshToken,
    ]),
  ],
  providers: [],
  exports: [],
})
export class AuthorizationModule {}
