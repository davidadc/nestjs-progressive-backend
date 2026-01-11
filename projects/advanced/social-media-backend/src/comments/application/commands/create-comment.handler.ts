import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCommentCommand } from './create-comment.command';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository.interface';
import type { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { CommentEntity } from '../../../shared/persistence/entities/comment.entity';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { CommentCreatedEvent } from '../../domain/events/comment-created.event';
import { CommentResponseDto } from '../dto/comment-response.dto';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentResponseDto> {
    const { postId, userId, content } = command;

    // Check if post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    // Create comment
    const comment = new CommentEntity();
    comment.postId = postId;
    comment.userId = userId;
    comment.content = content;
    comment.likesCount = 0;

    const savedComment = await this.commentRepository.save(comment);

    // Increment post's comment count
    await this.postRepository.incrementCommentsCount(postId);

    // Publish event
    this.eventBus.publish(
      new CommentCreatedEvent(savedComment.id, postId, userId, post.authorId),
    );

    // Fetch with user for response
    const commentWithUser = await this.commentRepository.findByIdWithUser(
      savedComment.id,
    );

    return {
      id: commentWithUser!.id,
      postId: commentWithUser!.postId,
      content: commentWithUser!.content,
      likesCount: commentWithUser!.likesCount,
      author: {
        id: commentWithUser!.user.id,
        username: commentWithUser!.user.username,
        name: commentWithUser!.user.name,
        avatar: commentWithUser!.user.avatar,
      },
      createdAt: commentWithUser!.createdAt,
      updatedAt: commentWithUser!.updatedAt,
    };
  }
}
