import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationHelper } from '../authentication/authentication.helper';
import { UserauthModule } from '../authentication/authentication.module';
import { RedisCacheModule } from '../../common/cache/redis-cache/redis-cache.module';
import { RedisCacheService } from '../../common/cache/redis-cache/redis-cache.service';
import User from './entity/user.entity';
import EntityModel from './entity/entity.entity';
import EntityPermission from './entity/entityPermission.entity';
import Group from './entity/group.entity';
import GroupPermission from './entity/groupPermission.entity';
import Permission from './entity/permission.entity';
import UserGroup from './entity/userGroup.entity';
import UserOrganisation from './entity/user.organisation.entity';
import UserPermission from './entity/userPermission.entity';
import { EntityService } from './service/entity.service';
import { GroupService } from './service/group.service';
import GroupCacheService from './service/groupcache.service';
import { PermissionService } from './service/permission.service';
import PermissionCacheService from './service/permissioncache.service';
import UserService from './service/user.service';
import OrganisationService from './service/organisation.service';
import OrganisationClauseService from './service/organisation.clause.service';
import UserCacheService from './service/usercache.service';
import Organisation from './entity/organisation.entity';
import OrganisationClause from './entity/organisationClause.entity';
import StateNonce from './entity/state.nonce.entity';
import Country from './entity/country.entity';
import { StateNonceService } from './service/state.nonce.service';
import { UserLinkedAccountsService } from './service/userLinkedAccounts.service';
import UserLinkedAccounts from './entity/user.linked.accounts.entity';
import CountryService from './service/country.service';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import UserOrganisationService from './service/user.organisation.service';
import { MergeModule } from '../merge/merge.module';
import { OrganisationMultiFactorAuthService } from './service/organisationMultiFactorAuth.service';
import OrganisationMultiFactorAuth from './entity/organisation.multiFactorAuth.entity';
import { EmailModule } from '../email/email.module';
import { ContractModule } from '../contract/contract.module';
import { TemplationModule } from '../templation/templation.module';
import { EventModule } from '../event/event.module';
import { TaskModule } from '../task/task.module';
import { ShareModule } from '../share/share.module';
import { MixpanelModule } from '../mixpanel/mixpanel.module';
import { SirenModule } from '../siren/siren.module';
import UserConsent from './entity/user.consent.entity';
import UserConsentService from './service/user.consent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      Permission,
      User,
      UserGroup,
      UserOrganisation,
      UserPermission,
      GroupPermission,
      EntityModel,
      EntityPermission,
      Organisation,
      OrganisationClause,
      UserLinkedAccounts,
      StateNonce,
      Country,
      OrganisationMultiFactorAuth,
      UserConsent,
    ]),
    RedisCacheModule,
    forwardRef(() => UserauthModule),
    HttpModule,
    BlockchainModule,
    forwardRef(() => SubscriptionModule),
    forwardRef(() => MergeModule),
    forwardRef(() => EmailModule),
    forwardRef(() => ContractModule),
    TemplationModule,
    EventModule,
    TaskModule,
    forwardRef(() => ShareModule),
    MixpanelModule,
    forwardRef(() => SirenModule),
  ],
  providers: [
    OrganisationService,
    OrganisationClauseService,
    GroupService,
    PermissionService,
    PermissionCacheService,
    EntityService,
    UserService,
    OrganisationService,
    RedisCacheService,
    UserCacheService,
    GroupCacheService,
    AuthenticationHelper,
    ConfigService,
    UserLinkedAccountsService,
    CountryService,
    StateNonceService,
    UserOrganisationService,
    OrganisationMultiFactorAuthService,
    UserConsentService,
  ],
  exports: [
    UserService,
    OrganisationService,
    OrganisationClauseService,
    GroupService,
    PermissionService,
    CountryService,
    StateNonceService,
    UserLinkedAccountsService,
    EntityService,
    UserOrganisationService,
    OrganisationMultiFactorAuthService,
    UserConsentService,
  ],
})
export class AuthorizationModule {}
