import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

// Controllers
import { NotificationsController } from './infrastructure/controllers/notifications.controller';

// Gateway
import { NotificationsGateway } from './infrastructure/gateways/notifications.gateway';

// Repository
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';

// Command Handlers
import { CreateNotificationHandler } from './application/commands/create-notification.handler';
import { SendNotificationHandler } from './application/commands/send-notification.handler';
import { MarkAsReadHandler } from './application/commands/mark-as-read.handler';
import { MarkAllAsReadHandler } from './application/commands/mark-all-as-read.handler';

// Query Handlers
import { GetNotificationsHandler } from './application/queries/get-notifications.handler';
import { GetUnreadCountHandler } from './application/queries/get-unread-count.handler';

// Event Handlers
import { NotificationCreatedHandler } from './application/event-handlers/notification-created.handler';
import { NotificationReadHandler } from './application/event-handlers/notification-read.handler';

// Services
import { NotificationService } from './application/services/notification.service';

const CommandHandlers = [
  CreateNotificationHandler,
  SendNotificationHandler,
  MarkAsReadHandler,
  MarkAllAsReadHandler,
];

const QueryHandlers = [GetNotificationsHandler, GetUnreadCountHandler];

const EventHandlers = [NotificationCreatedHandler, NotificationReadHandler];

@Module({
  imports: [CqrsModule, JwtModule],
  controllers: [NotificationsController],
  providers: [
    // Repository
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
    // Services
    NotificationService,
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    // Gateway
    NotificationsGateway,
  ],
  exports: [NOTIFICATION_REPOSITORY, NotificationService],
})
export class NotificationsModule {}
