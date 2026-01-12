import { EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { NotificationReadEvent } from '../../domain/events/notification-read.event';
import { NotificationsGateway } from '../../infrastructure/gateways/notifications.gateway';
import { GetUnreadCountQuery } from '../queries/get-unread-count.query';

@EventsHandler(NotificationReadEvent)
export class NotificationReadHandler
  implements IEventHandler<NotificationReadEvent>
{
  private readonly logger = new Logger(NotificationReadHandler.name);

  constructor(
    private readonly gateway: NotificationsGateway,
    private readonly queryBus: QueryBus,
  ) {}

  async handle(event: NotificationReadEvent): Promise<void> {
    this.logger.log(
      `Processing notification read event: ${event.notificationId}`,
    );

    try {
      // Get updated unread count
      const { count } = await this.queryBus.execute(
        new GetUnreadCountQuery(event.userId),
      );

      // Broadcast updated unread count to user via WebSocket
      this.gateway.sendUnreadCount(event.userId, count);

      this.logger.debug(
        `Updated unread count for user ${event.userId}: ${count}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing notification read event: ${event.notificationId}`,
        error,
      );
    }
  }
}
