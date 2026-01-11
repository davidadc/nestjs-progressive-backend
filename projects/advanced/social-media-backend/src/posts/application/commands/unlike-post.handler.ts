import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnlikePostCommand } from './unlike-post.command';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { PostUnlikedEvent } from '../../domain/events/post-unliked.event';

@CommandHandler(UnlikePostCommand)
export class UnlikePostHandler implements ICommandHandler<UnlikePostCommand> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UnlikePostCommand): Promise<void> {
    const { userId, postId } = command;

    // Check if post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    // Check if like exists
    const existingLike = await this.postRepository.findLike(userId, postId);
    if (!existingLike) {
      throw ProblemDetailsFactory.notLiked('post');
    }

    // Delete like
    await this.postRepository.deleteLike(userId, postId);

    // Decrement likes count
    await this.postRepository.decrementLikesCount(postId);

    // Publish event
    this.eventBus.publish(new PostUnlikedEvent(postId, userId));
  }
}
