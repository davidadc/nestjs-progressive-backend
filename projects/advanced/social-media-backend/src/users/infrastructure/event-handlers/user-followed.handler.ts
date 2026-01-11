import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UserFollowedEvent } from '../../domain/events/user-followed.event';
import { NotificationEntity } from '../../../shared/persistence/entities/notification.entity';

@EventsHandler(UserFollowedEvent)
export class UserFollowedHandler implements IEventHandler<UserFollowedEvent> {
  private readonly logger = new Logger(UserFollowedHandler.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async handle(event: UserFollowedEvent): Promise<void> {
    const { followerId, followingId } = event;

    try {
      // Create notification for the user being followed
      const notification = this.notificationRepo.create({
        userId: followingId,
        type: 'follow',
        actorId: followerId,
        targetId: followerId, // The target is the follower in this case
      });

      await this.notificationRepo.save(notification);

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
