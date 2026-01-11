import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPostCommentsQuery } from './get-post-comments.query';
import type { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository.interface';
import type { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { CommentResponseDto } from '../dto/comment-response.dto';
import {
  PaginatedResult,
  PaginationMeta,
} from '../../../common/interceptors/response-envelope.interceptor';

@QueryHandler(GetPostCommentsQuery)
export class GetPostCommentsHandler
  implements IQueryHandler<GetPostCommentsQuery>
{
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    query: GetPostCommentsQuery,
  ): Promise<PaginatedResult<CommentResponseDto>> {
    const { postId, page, limit } = query;

    // Check if post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    const result = await this.commentRepository.findByPost(postId, {
      page,
      limit,
    });

    const items: CommentResponseDto[] = result.items.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      likesCount: comment.likesCount,
      author: {
        id: comment.user.id,
        username: comment.user.username,
        name: comment.user.name,
        avatar: comment.user.avatar,
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    const pagination: PaginationMeta = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrevious: result.page > 1,
    };

    return { items, pagination };
  }
}
