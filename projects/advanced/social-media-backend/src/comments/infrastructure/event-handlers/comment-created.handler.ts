import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CommentCreatedEvent } from '../../domain/events/comment-created.event';
import { NotificationEntity } from '../../../shared/persistence/entities/notification.entity';

@EventsHandler(CommentCreatedEvent)
export class CommentCreatedHandler
  implements IEventHandler<CommentCreatedEvent>
{
  private readonly logger = new Logger(CommentCreatedHandler.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async handle(event: CommentCreatedEvent): Promise<void> {
    const { commentId, postId, userId, postAuthorId } = event;

    // Don't notify if user comments on their own post
    if (userId === postAuthorId) {
      return;
    }

    try {
      const notification = this.notificationRepo.create({
        userId: postAuthorId,
        type: 'comment',
        actorId: userId,
        targetId: postId,
      });

      await this.notificationRepo.save(notification);

      this.logger.log(
        `Created comment notification for post ${postId} by user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create comment notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
