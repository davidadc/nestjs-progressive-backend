import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserNotificationsQuery } from './get-user-notifications.query';
import { NotificationListResponseDto, NotificationDto } from '../dto';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import type { NotificationEntity } from '../../../shared/persistence/entities/notification.entity';

@QueryHandler(GetUserNotificationsQuery)
export class GetUserNotificationsHandler
  implements IQueryHandler<GetUserNotificationsQuery, NotificationListResponseDto>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    query: GetUserNotificationsQuery,
  ): Promise<NotificationListResponseDto> {
    const { userId, page, limit } = query;

    const [result, unreadCount] = await Promise.all([
      this.notificationRepository.findByUser(userId, { page, limit }),
      this.notificationRepository.getUnreadCount(userId),
    ]);

    return {
      items: result.items.map((notification) =>
        this.mapToDto(notification),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      unreadCount,
    };
  }

  private mapToDto(notification: NotificationEntity): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      actor: {
        id: notification.actor?.id || notification.actorId,
        username: notification.actor?.username || 'unknown',
        avatar: notification.actor?.avatar,
      },
      targetId: notification.targetId,
      read: notification.read,
      createdAt: notification.createdAt,
    };
  }
}
