import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetNotificationsQuery } from './get-notifications.query';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';
import { NotificationMapper } from '../mappers/notification.mapper';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { PaginationDto } from '../dto/pagination.dto';

export interface GetNotificationsResult {
  data: NotificationResponseDto[];
  pagination: PaginationDto;
}

@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler
  implements IQueryHandler<GetNotificationsQuery, GetNotificationsResult>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(query: GetNotificationsQuery): Promise<GetNotificationsResult> {
    const { data: notifications, total } =
      await this.notificationRepository.findByUserId(
        query.userId,
        { page: query.page, limit: query.limit },
        { read: query.read, type: query.type },
      );

    return {
      data: notifications.map(NotificationMapper.toDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}
