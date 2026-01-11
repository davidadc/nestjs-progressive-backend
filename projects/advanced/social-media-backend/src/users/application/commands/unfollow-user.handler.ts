import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnfollowUserCommand } from './unfollow-user.command';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { UserUnfollowedEvent } from '../../domain/events/user-unfollowed.event';

@CommandHandler(UnfollowUserCommand)
export class UnfollowUserHandler
  implements ICommandHandler<UnfollowUserCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UnfollowUserCommand): Promise<void> {
    const { followerId, followingId } = command;

    // Check if user exists
    const userToUnfollow = await this.userRepository.findById(followingId);
    if (!userToUnfollow) {
      throw ProblemDetailsFactory.notFound('User', followingId);
    }

    // Check if following
    const existingFollow = await this.userRepository.findFollow(
      followerId,
      followingId,
    );
    if (!existingFollow) {
      throw ProblemDetailsFactory.notFollowing(userToUnfollow.username);
    }

    // Delete follow relationship
    await this.userRepository.deleteFollow(followerId, followingId);

    // Update counters
    await this.userRepository.decrementFollowingCount(followerId);
    await this.userRepository.decrementFollowersCount(followingId);

    // Publish event
    this.eventBus.publish(new UserUnfollowedEvent(followerId, followingId));
  }
}
