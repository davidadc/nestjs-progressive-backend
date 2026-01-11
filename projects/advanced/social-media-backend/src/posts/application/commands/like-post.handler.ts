import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { LikePostCommand } from './like-post.command';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { PostLikedEvent } from '../../domain/events/post-liked.event';

@CommandHandler(LikePostCommand)
export class LikePostHandler implements ICommandHandler<LikePostCommand> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LikePostCommand): Promise<void> {
    const { userId, postId } = command;

    // Check if post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    // Check if already liked
    const existingLike = await this.postRepository.findLike(userId, postId);
    if (existingLike) {
      throw ProblemDetailsFactory.alreadyLiked('post');
    }

    // Create like
    await this.postRepository.createLike(userId, postId);

    // Increment likes count
    await this.postRepository.incrementLikesCount(postId);

    // Publish event (for notification)
    this.eventBus.publish(new PostLikedEvent(postId, userId, post.authorId));
  }
}
