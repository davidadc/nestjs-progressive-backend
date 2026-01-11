import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../shared/persistence/entities/notification.entity';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { NotificationsController } from './infrastructure/controllers/notifications.controller';
import { GetUserNotificationsHandler } from './application/queries/get-user-notifications.handler';
import { MarkNotificationReadHandler } from './application/commands/mark-notification-read.handler';
import { MarkAllNotificationsReadHandler } from './application/commands/mark-all-notifications-read.handler';
import { UserFollowedNotificationHandler } from './infrastructure/event-handlers/user-followed-notification.handler';
import { PostLikedNotificationHandler } from './infrastructure/event-handlers/post-liked-notification.handler';
import { CommentAddedNotificationHandler } from './infrastructure/event-handlers/comment-added-notification.handler';

const QueryHandlers = [GetUserNotificationsHandler];

const CommandHandlers = [
  MarkNotificationReadHandler,
  MarkAllNotificationsReadHandler,
];

const EventHandlers = [
  UserFollowedNotificationHandler,
  PostLikedNotificationHandler,
  CommentAddedNotificationHandler,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
    ...QueryHandlers,
    ...CommandHandlers,
    ...EventHandlers,
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
