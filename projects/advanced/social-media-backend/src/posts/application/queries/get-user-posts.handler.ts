import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserPostsQuery } from './get-user-posts.query';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { PostResponseDto } from '../dto/post-response.dto';
import {
  PaginatedResult,
  PaginationMeta,
} from '../../../common/interceptors/response-envelope.interceptor';

@QueryHandler(GetUserPostsQuery)
export class GetUserPostsHandler implements IQueryHandler<GetUserPostsQuery> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    query: GetUserPostsQuery,
  ): Promise<PaginatedResult<PostResponseDto>> {
    const { userId, page, limit, currentUserId } = query;

    const result = await this.postRepository.findByAuthor(userId, {
      page,
      limit,
    });

    const items: PostResponseDto[] = await Promise.all(
      result.items.map(async (post) => {
        let isLiked: boolean | undefined;
        if (currentUserId) {
          const like = await this.postRepository.findLike(
            currentUserId,
            post.id,
          );
          isLiked = !!like;
        }

        return {
          id: post.id,
          content: post.content,
          images: post.images,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          author: {
            id: post.author.id,
            username: post.author.username,
            name: post.author.name,
            avatar: post.author.avatar,
          },
          isLiked,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      }),
    );

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
