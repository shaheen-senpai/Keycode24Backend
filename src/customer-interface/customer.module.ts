import { Module } from '@nestjs/common';
import UserauthResolver from './authentication/resolver/userauth.resolver';
import { GroupResolver } from './authorization/resolver/group.resolver';
import { PermissionResolver } from './authorization/resolver/permission.resolver';
import { UserResolver } from './authorization/resolver/user.resolver';
import { UserLinkedAccountsResolver } from './authorization/resolver/userLinkedAccounts.resolver';
import { EntityResolver } from './authorization/resolver/entity.resolver';
import * as coreModules from '../core/index';
import { SingpassResolver } from './authentication/resolver/singpass.resolver';
import { OrganisationResolver } from './authorization/resolver/organisation.resolver';
import { OrganisationClauseResolver } from './authorization/resolver/organisationClause.resolver';
import { CountryResolver } from './authorization/resolver/country.resolver';
import { UserController } from './authentication/controller/user.controller';
import { SingpassController } from './authentication/controller/singpass.controller';
import { LoggerService } from '../common/logger/logger.service';
import { GoogleAuthController } from './authentication/controller/google.controller';
import { UserOrganisationResolver } from './authorization/resolver/user.orgaisation.resolver';
import { BaseDataResolver } from './authentication/resolver/base.data.resolver';
import { CustomerUserResolver } from './authorization/resolver/customer.user.resolver';
import { UserAuthController } from './authentication/controller/userauth.controller';
@Module({
  imports: [...Object.values(coreModules)],
  providers: [
    UserauthResolver,
    OrganisationResolver,
    OrganisationClauseResolver,
    GroupResolver,
    PermissionResolver,
    UserResolver,
    CustomerUserResolver,
    EntityResolver,
    SingpassResolver,
    BaseDataResolver,
    CountryResolver,
    LoggerService,
    UserLinkedAccountsResolver,
    UserOrganisationResolver,
  ],
  controllers: [
    GoogleAuthController,
    UserController,
    UserAuthController,
    SingpassController,
  ],
  exports: [],
})
export class CustomerModule {}
