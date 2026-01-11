import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { PostLikedEvent } from '../../../posts/domain/events/post-liked.event';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';

@EventsHandler(PostLikedEvent)
export class PostLikedNotificationHandler
  implements IEventHandler<PostLikedEvent>
{
  private readonly logger = new Logger(PostLikedNotificationHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async handle(event: PostLikedEvent): Promise<void> {
    const { postId, userId, postAuthorId } = event;

    // Don't create notification if user likes their own post
    if (userId === postAuthorId) {
      return;
    }

    try {
      await this.notificationRepository.create({
        userId: postAuthorId, // The post author receives the notification
        type: 'like',
        actorId: userId, // The user who liked
        targetId: postId, // The post that was liked
      });

      this.logger.log(
        `Created like notification for user ${postAuthorId} on post ${postId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create like notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
