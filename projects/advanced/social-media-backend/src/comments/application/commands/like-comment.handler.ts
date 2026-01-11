import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { LikeCommentCommand } from './like-comment.command';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { CommentLikedEvent } from '../../domain/events/comment-liked.event';

@CommandHandler(LikeCommentCommand)
export class LikeCommentHandler implements ICommandHandler<LikeCommentCommand> {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LikeCommentCommand): Promise<void> {
    const { userId, commentId } = command;

    // Check if comment exists
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw ProblemDetailsFactory.notFound('Comment', commentId);
    }

    // Check if already liked
    const existingLike = await this.commentRepository.findLike(
      userId,
      commentId,
    );
    if (existingLike) {
      throw ProblemDetailsFactory.alreadyLiked('comment');
    }

    // Create like
    await this.commentRepository.createLike(userId, commentId);

    // Increment likes count
    await this.commentRepository.incrementLikesCount(commentId);

    // Publish event (for notification)
    this.eventBus.publish(
      new CommentLikedEvent(commentId, userId, comment.userId),
    );
  }
}
