import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPostsByHashtagQuery } from './get-posts-by-hashtag.query';
import type { IHashtagRepository } from '../../domain/repositories/hashtag.repository.interface';
import { HASHTAG_REPOSITORY } from '../../domain/repositories/hashtag.repository.interface';
import type { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { PostResponseDto } from '../../../posts/application/dto/post-response.dto';
import {
  PaginatedResult,
  PaginationMeta,
} from '../../../common/interceptors/response-envelope.interceptor';

@QueryHandler(GetPostsByHashtagQuery)
export class GetPostsByHashtagHandler
  implements IQueryHandler<GetPostsByHashtagQuery>
{
  constructor(
    @Inject(HASHTAG_REPOSITORY)
    private readonly hashtagRepository: IHashtagRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    query: GetPostsByHashtagQuery,
  ): Promise<PaginatedResult<PostResponseDto>> {
    const { tag, page, limit, currentUserId } = query;

    // Normalize tag (remove # if present, lowercase)
    const normalizedTag = tag.replace(/^#/, '').toLowerCase();

    // Check if hashtag exists
    const hashtag = await this.hashtagRepository.findByTag(normalizedTag);
    if (!hashtag) {
      throw ProblemDetailsFactory.notFound('Hashtag', normalizedTag);
    }

    const result = await this.hashtagRepository.getPostsByHashtag(
      normalizedTag,
      { page, limit },
    );

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
