import { Injectable } from '@nestjs/common';
import * as entities from 'entities';
import { EnableLog } from '../../authorization/logging.decorator';
import { NotificationInput, NotificationService } from './notification.service';
import { AccessTokenData } from '../../authorization/constants/authorization.constants';
import User from '../../authorization/entity/user.entity';
import Task from '../../task/entity/task.entity';
import { NotificationType } from '../../../customer-interface/schema/graphql.schema';
@Injectable()
export class TaskNotificationService {
  constructor(private notificationService: NotificationService) {}

  /**
   * To send task assign notification
   * @param assignedUser
   * @param assigningUser
   * @param task
   * @param user
   */
  @EnableLog()
  public async notifyTaskAssign(
    assignedUser: User,
    assigningUser: User | null,
    task: Task,
    user: AccessTokenData,
  ) {
    const sanitizedContent = entities.encode(assigningUser?.fullName || '');
    const notificationInput = {
      userId: assignedUser.id,
      organisationId: user.organisation.id,
      htmlMessage: `A task has been assigned to you by <b>${sanitizedContent} </b>`,
      message: `A task has been assigned to you by ${sanitizedContent}.`,
      type: NotificationType.TaskAssigned,
      data: this.notificationService.getNotificationData({
        taskId: task.id,
      }),
    };
    await this.notificationService.addNotification(notificationInput);
  }

  /**
   * To send task update notification
   * @param assignedUser
   * @param assigningUser
   * @param task
   * @param user
   */
  @EnableLog()
  public async notifyTaskUpdate(
    assignedUser: User,
    task: Task,
    user: AccessTokenData,
  ) {
    const sanitizedContent = entities.encode(task.title);
    const notificationInput = {
      userId: assignedUser.id,
      organisationId: user.organisation.id,
      htmlMessage: `Task titled <b>${sanitizedContent} </b> has been updated`,
      message: `Task titled ${sanitizedContent} has been updated.`,
      type: NotificationType.TaskAssigned,
      data: this.notificationService.getNotificationData({
        taskId: task.id,
      }),
    };
    await this.notificationService.addNotification(notificationInput);
  }

  /**
   * To send notification when task is marked as done
   * @param assignedUser
   * @param task
   * @param user
   */
  @EnableLog()
  public async notifyTaskCompletion(
    assignedUser: User,
    task: Task,
    user: AccessTokenData,
  ) {
    const sanitizedContent = entities.encode(task.title);
    const notificationInput = {
      userId: assignedUser.id,
      organisationId: user.organisation.id,
      htmlMessage: `Task titled <b>${sanitizedContent} </b> has been marked as done`,
      message: `Task titled ${sanitizedContent} has been marked as done.`,
      type: NotificationType.TaskAssigned,
      data: this.notificationService.getNotificationData({
        taskId: task.id,
      }),
    };
    await this.notificationService.addNotification(notificationInput);
  }

  /**
   * to send due date reminder notification to assignee
   * @param assignedUser
   * @param task
   * @param user
   */
  @EnableLog()
  public async notifyTaskReminder(assignedUsers: User[], task: Task) {
    const sanitizedContent = entities.encode(task.title);
    const notificationInput: NotificationInput[] = assignedUsers.map(
      (user: User) => {
        return {
          organisationId: task.organisationId,
          htmlMessage: `Due Date Reminder - Task titled <b>${sanitizedContent} </b> requires action.`,
          message: `Due Date Reminder - Task titled ${sanitizedContent} requires action.`,
          type: NotificationType.TaskAssigned,
          data: this.notificationService.getNotificationData({
            taskId: task.id,
          }),
          userId: user.id,
        };
      },
    );

    await this.notificationService.addNotification(notificationInput);
  }
}
