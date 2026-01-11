import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { UserFollowedEvent } from '../../../users/domain/events/user-followed.event';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../domain/repositories/notification.repository.interface';

@EventsHandler(UserFollowedEvent)
export class UserFollowedNotificationHandler
  implements IEventHandler<UserFollowedEvent>
{
  private readonly logger = new Logger(UserFollowedNotificationHandler.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async handle(event: UserFollowedEvent): Promise<void> {
    const { followerId, followingId } = event;

    // Don't create notification if user follows themselves (shouldn't happen but just in case)
    if (followerId === followingId) {
      return;
    }

    try {
      await this.notificationRepository.create({
        userId: followingId, // The user being followed receives the notification
        type: 'follow',
        actorId: followerId, // The user who followed
        targetId: followerId, // Target is the follower's profile
      });

      this.logger.log(
        `Created follow notification for user ${followingId} from ${followerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create follow notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
