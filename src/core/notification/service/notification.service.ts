import {
  GetUnreadUserNotificationsCountOutput,
  NotificationType,
  GetUserNotificationsOutput,
  GetUserNotificationsInput,
} from '../../../customer-interface/schema/graphql.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessTokenData } from '../../authorization/constants/authorization.constants';
import {
  FindManyOptions,
  FindOptionsWhere,
  In,
  IsNull,
  Not,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import Notification from '../entity/notification.entity';
import { Injectable } from '@nestjs/common';
import { getPaginationMetaData } from '../../../common/utils/general.utils';
import { Transactional } from 'typeorm-transactional';
import { EnableLog } from '../../authorization/logging.decorator';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  /**
   * To add notification(s) to DB
   * @param notificationInput notification input. Can be a single object or an array of objects.
   */
  async addNotification(
    notificationInput: NotificationInput | NotificationInput[],
  ) {
    const obj: NotificationInput[] =
      notificationInput instanceof Array
        ? notificationInput
        : [notificationInput];
    const result: Notification[] = await this.notificationRepo.save(
      obj as Notification[],
    );
    return notificationInput instanceof Array ? result : result[0];
  }

  /**
   * To get user notifications
   * @param user
   * @param input pagination and isRead Flag
   */
  async getUserNotifications(
    user: AccessTokenData,
    input: GetUserNotificationsInput,
  ): Promise<GetUserNotificationsOutput> {
    const where: FindOptionsWhere<Notification> = {
      userId: user.id,
      organisationId: user.organisation.id,
    };
    if (input.isRead == true) where.readAt = Not(IsNull());
    if (input.isRead == false) where.readAt = IsNull();
    const queryObj: FindManyOptions<Notification> = {
      where,
      relations: ['user'],
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
      skip: input.pagination.offset,
      take: input.pagination.limit,
    };
    const [allNotifications, count] = await this.notificationRepo.findAndCount(
      queryObj,
    );
    return {
      notifications: allNotifications,
      pagination: getPaginationMetaData(input.pagination, count),
    } as GetUserNotificationsOutput;
  }

  /**
   * To get the count of unread notifications of a user
   * @returns count as Integer
   */
  async getUnreadUserNotificationsCount(
    user: AccessTokenData,
  ): Promise<GetUnreadUserNotificationsCountOutput> {
    const unReadCount = await this.notificationRepo
      .createQueryBuilder()
      .where({ userId: user.id, organisationId: user.organisation.id })
      .andWhere({ readAt: IsNull() })
      .getCount();
    return { unReadCount };
  }

  /**
   * To update notifications by readAt
   * @param ids
   * @param user
   */
  @Transactional()
  @EnableLog()
  async markReadNotifications(
    ids: string[],
    user: AccessTokenData,
  ): Promise<boolean> {
    const queryObj: any = {
      userId: user.id,
      organisationId: user.organisation.id,
    };
    if (ids.length) {
      queryObj['id'] = In(ids);
    }
    const result = await this.notificationRepo.update(queryObj, {
      readAt: new Date().toISOString(),
    });
    return ids.length ? result.affected == ids.length : result.affected !== 0;
  }

  /**
   * To generate the data field of notification
   * @param input input for constructing data object.
   * @returns JSON ObjectLiteral
   */
  getNotificationData = (input: ObjectLiteral, version = '1.0') => {
    const notificationData = {
      Version: version, // change version when the output structure is changed.
      data: input,
    };
    return notificationData as ObjectLiteral;
  };
}

export type NotificationInput = {
  userId: string;
  organisationId: string;
  htmlMessage?: string;
  message: string;
  type: NotificationType;
  data?: ObjectLiteral;
};
