import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FollowUserCommand } from './follow-user.command';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { UserFollowedEvent } from '../../domain/events/user-followed.event';

@CommandHandler(FollowUserCommand)
export class FollowUserHandler implements ICommandHandler<FollowUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FollowUserCommand): Promise<void> {
    const { followerId, followingId } = command;

    // Cannot follow yourself
    if (followerId === followingId) {
      throw ProblemDetailsFactory.cannotFollowSelf();
    }

    // Check if user to follow exists
    const userToFollow = await this.userRepository.findById(followingId);
    if (!userToFollow) {
      throw ProblemDetailsFactory.notFound('User', followingId);
    }

    // Check if already following
    const existingFollow = await this.userRepository.findFollow(
      followerId,
      followingId,
    );
    if (existingFollow) {
      throw ProblemDetailsFactory.alreadyFollowing(userToFollow.username);
    }

    // Create follow relationship
    await this.userRepository.createFollow(followerId, followingId);

    // Update counters
    await this.userRepository.incrementFollowingCount(followerId);
    await this.userRepository.incrementFollowersCount(followingId);

    // Publish event
    this.eventBus.publish(new UserFollowedEvent(followerId, followingId));
  }
}
