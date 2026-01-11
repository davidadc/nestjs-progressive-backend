import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCommentCommand } from './delete-comment.command';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository.interface';
import type { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { CommentDeletedEvent } from '../../domain/events/comment-deleted.event';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const { commentId, userId } = command;

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw ProblemDetailsFactory.notFound('Comment', commentId);
    }

    // Only comment author can delete
    if (comment.userId !== userId) {
      throw ProblemDetailsFactory.forbidden(
        'You can only delete your own comments',
      );
    }

    // Delete comment
    await this.commentRepository.delete(commentId);

    // Decrement post's comment count
    await this.postRepository.decrementCommentsCount(comment.postId);

    // Publish event
    this.eventBus.publish(new CommentDeletedEvent(commentId, comment.postId));
  }
}
