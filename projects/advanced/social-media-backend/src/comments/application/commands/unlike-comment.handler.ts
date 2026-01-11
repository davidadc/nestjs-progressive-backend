import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnlikeCommentCommand } from './unlike-comment.command';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { CommentUnlikedEvent } from '../../domain/events/comment-unliked.event';

@CommandHandler(UnlikeCommentCommand)
export class UnlikeCommentHandler
  implements ICommandHandler<UnlikeCommentCommand>
{
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UnlikeCommentCommand): Promise<void> {
    const { userId, commentId } = command;

    // Check if comment exists
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw ProblemDetailsFactory.notFound('Comment', commentId);
    }

    // Check if like exists
    const existingLike = await this.commentRepository.findLike(
      userId,
      commentId,
    );
    if (!existingLike) {
      throw ProblemDetailsFactory.notLiked('comment');
    }

    // Delete like
    await this.commentRepository.deleteLike(userId, commentId);

    // Decrement likes count
    await this.commentRepository.decrementLikesCount(commentId);

    // Publish event
    this.eventBus.publish(new CommentUnlikedEvent(commentId, userId));
  }
}
