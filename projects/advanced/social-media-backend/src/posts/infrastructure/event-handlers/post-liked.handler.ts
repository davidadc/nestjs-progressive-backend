import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { PostLikedEvent } from '../../domain/events/post-liked.event';
import { NotificationEntity } from '../../../shared/persistence/entities/notification.entity';

@EventsHandler(PostLikedEvent)
export class PostLikedHandler implements IEventHandler<PostLikedEvent> {
  private readonly logger = new Logger(PostLikedHandler.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async handle(event: PostLikedEvent): Promise<void> {
    const { postId, userId, postAuthorId } = event;

    // Don't notify if user likes their own post
    if (userId === postAuthorId) {
      return;
    }

    try {
      const notification = this.notificationRepo.create({
        userId: postAuthorId,
        type: 'like',
        actorId: userId,
        targetId: postId,
      });

      await this.notificationRepo.save(notification);

      this.logger.log(
        `Created like notification for post ${postId} by user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create like notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
