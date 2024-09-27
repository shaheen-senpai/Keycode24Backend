import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleAuthService } from './service/google.service';
import UserauthService from './service/userauth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationHelper } from './authentication.helper';
import Group from '../authorization/entity/group.entity';
import GroupPermission from '../authorization/entity/groupPermission.entity';
import Permission from '../authorization/entity/permission.entity';
import UserGroup from '../authorization/entity/userGroup.entity';
import User from '../authorization/entity/user.entity';
import UserPermission from '../authorization/entity/userPermission.entity';
import { GoogleStrategy } from './passport/googleStrategy';
import UserCacheService from '../authorization/service/usercache.service';
import { RedisCacheModule } from '../../common/cache/redis-cache/redis-cache.module';
import GroupCacheService from '../authorization/service/groupcache.service';
import { LoggerService } from '../../common/logger/logger.service';
import UserRefreshToken from '../authorization/entity/userRefreshToken.entity';
import PermissionCacheService from '../authorization/service/permissioncache.service';
import Organisation from '../authorization/entity/organisation.entity';
import { SingpassService } from './service/singpass.service';
import StateNonce from '../authorization/entity/state.nonce.entity';
import { SingpassHelper } from './singpass.helper';
import UserLinkedAccounts from '../authorization/entity/user.linked.accounts.entity';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import Country from '../authorization/entity/country.entity';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { GoogleAuthController } from '../../customer-interface/authentication/controller/google.controller';
import { SingpassController } from '../../customer-interface/authentication/controller/singpass.controller';
import { EmailModule } from '../email/email.module';
import { SirenModule } from '../siren/siren.module';
import { MixpanelModule } from '../mixpanel/mixpanel.module';
import IPAPIService from './service/ipapi.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Organisation]),
    TypeOrmModule.forFeature([Group]),
    TypeOrmModule.forFeature([Permission]),
    TypeOrmModule.forFeature([UserGroup]),
    TypeOrmModule.forFeature([UserPermission]),
    TypeOrmModule.forFeature([GroupPermission]),
    TypeOrmModule.forFeature([UserRefreshToken]),
    TypeOrmModule.forFeature([StateNonce]),
    TypeOrmModule.forFeature([Country]),
    TypeOrmModule.forFeature([UserLinkedAccounts]), // TODO: shall we import authorization module as a whole?
    ConfigModule,
    RedisCacheModule,
    HttpModule,
    BlockchainModule,
    EmailModule,
    forwardRef(() => SubscriptionModule),
    forwardRef(() => AuthorizationModule),
    SirenModule,
    MixpanelModule,
  ],
  providers: [
    UserauthService,
    PermissionCacheService,
    GoogleAuthController,
    SingpassController,
    GoogleAuthService,
    AuthenticationHelper,
    ConfigService,
    GoogleStrategy,
    UserCacheService,
    GroupCacheService,
    SingpassHelper,
    LoggerService,
    SingpassService,
    IPAPIService,
  ],
  exports: [
    UserauthService,
    AuthenticationHelper,
    ConfigService,
    HttpModule,
    SingpassService,
    GoogleAuthService,
    IPAPIService,
  ],
})
export class UserauthModule {}
