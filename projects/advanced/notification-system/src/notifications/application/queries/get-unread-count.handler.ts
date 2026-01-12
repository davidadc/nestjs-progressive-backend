import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUnreadCountQuery } from './get-unread-count.query';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';

export interface GetUnreadCountResult {
  count: number;
}

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler
  implements IQueryHandler<GetUnreadCountQuery, GetUnreadCountResult>
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(query: GetUnreadCountQuery): Promise<GetUnreadCountResult> {
    const count = await this.notificationRepository.countUnread(query.userId);
    return { count };
  }
}
