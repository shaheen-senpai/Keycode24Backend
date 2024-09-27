import { Injectable } from '@nestjs/common';
import { EnableLog } from '../../authorization/logging.decorator';
import { NotificationService, NotificationInput } from './notification.service';
@Injectable()
export class EventNotificationService {
  constructor(private notificationService: NotificationService) {}
  /**
   * function to notify user on event tag or untag
   * @param notificationArray
   */
  @EnableLog()
  public async notifyEventUserTagOrUnTag(
    notificationArray: NotificationInput[],
  ) {
    await this.notificationService.addNotification(notificationArray);
  }
}
