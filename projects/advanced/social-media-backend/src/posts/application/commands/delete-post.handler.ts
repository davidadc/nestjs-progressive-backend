import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeletePostCommand } from './delete-post.command';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { PostDeletedEvent } from '../../domain/events/post-deleted.event';

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const { postId, userId } = command;

    const post = await this.postRepository.findByIdWithAuthor(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    // Only author can delete their post
    if (post.authorId !== userId) {
      throw ProblemDetailsFactory.forbidden(
        'You can only delete your own posts',
      );
    }

    // Decrement hashtag usage counts
    if (post.hashtags && post.hashtags.length > 0) {
      for (const hashtag of post.hashtags) {
        await this.postRepository.decrementHashtagUsage(hashtag.id);
      }
    }

    // Delete post
    await this.postRepository.delete(postId);

    // Decrement author's post count
    await this.postRepository.decrementPostsCount(post.authorId);

    // Publish event
    this.eventBus.publish(new PostDeletedEvent(postId, post.authorId));
  }
}
