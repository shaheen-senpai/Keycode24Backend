import { Injectable } from '@nestjs/common';
import { EnableLog } from '../../authorization/logging.decorator';
import { NotificationService, NotificationInput } from './notification.service';
@Injectable()
export class ShareNotificationService {
  constructor(private notificationService: NotificationService) {}
  @EnableLog()
  public async notifyContractShare(notificationArray: NotificationInput[]) {
    await this.notificationService.addNotification(notificationArray);
  }

  @EnableLog()
  public async notifyFolderShare(notificationArray: NotificationInput[]) {
    await this.notificationService.addNotification(notificationArray);
  }
}
