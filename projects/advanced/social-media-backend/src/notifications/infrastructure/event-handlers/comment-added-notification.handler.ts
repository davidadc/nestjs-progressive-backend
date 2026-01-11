import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CommentCreatedEvent } from '../../../comments/domain/events/comment-created.event';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';

@EventsHandler(CommentCreatedEvent)
export class CommentAddedNotificationHandler
  implements IEventHandler<CommentCreatedEvent>
{
  private readonly logger = new Logger(CommentAddedNotificationHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async handle(event: CommentCreatedEvent): Promise<void> {
    const { commentId, postId, userId, postAuthorId } = event;

    // Don't create notification if user comments on their own post
    if (userId === postAuthorId) {
      return;
    }

    try {
      await this.notificationRepository.create({
        userId: postAuthorId, // The post author receives the notification
        type: 'comment',
        actorId: userId, // The user who commented
        targetId: postId, // The post that was commented on
      });

      this.logger.log(
        `Created comment notification for user ${postAuthorId} on post ${postId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create comment notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
