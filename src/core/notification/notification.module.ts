import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationHelper } from '../authentication/authentication.helper';
import { UserauthModule } from '../authentication/authentication.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import Notification from './entity/notification.entity';
import { NotificationService } from './service/notification.service';
import { ContractNotificationService } from './service/contract.notification.service';
import { ShareNotificationService } from './service/share.notification.service';
import { TaskNotificationService } from './service/task.notification.service';
import { EventNotificationService } from './service/event.notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => AuthorizationModule),
    forwardRef(() => UserauthModule),
    HttpModule,
  ],
  providers: [
    ConfigService,
    AuthenticationHelper,
    NotificationService,
    ContractNotificationService,
    ShareNotificationService,
    TaskNotificationService,
    EventNotificationService,
  ],
  exports: [
    ContractNotificationService,
    NotificationService,
    ShareNotificationService,
    TaskNotificationService,
    EventNotificationService,
  ],
})
export class NotificationModule {}
