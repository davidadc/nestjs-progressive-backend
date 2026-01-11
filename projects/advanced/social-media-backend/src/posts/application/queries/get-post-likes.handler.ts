import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPostLikesQuery } from './get-post-likes.query';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { LikeUserDto } from '../dto/post-response.dto';
import {
  PaginatedResult,
  PaginationMeta,
} from '../../../common/interceptors/response-envelope.interceptor';

@QueryHandler(GetPostLikesQuery)
export class GetPostLikesHandler implements IQueryHandler<GetPostLikesQuery> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    query: GetPostLikesQuery,
  ): Promise<PaginatedResult<LikeUserDto>> {
    const { postId, page, limit } = query;

    // Check if post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    const result = await this.postRepository.getPostLikes(postId, {
      page,
      limit,
    });

    const items: LikeUserDto[] = result.items.map((like) => ({
      id: like.user.id,
      username: like.user.username,
      name: like.user.name,
      avatar: like.user.avatar,
      likedAt: like.createdAt,
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
