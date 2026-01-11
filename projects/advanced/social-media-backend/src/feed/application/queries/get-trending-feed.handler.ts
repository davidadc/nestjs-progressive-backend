import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTrendingFeedQuery } from './get-trending-feed.query';
import type { IFeedRepository } from '../../domain/repositories/feed.repository.interface';
import { FEED_REPOSITORY } from '../../domain/repositories/feed.repository.interface';
import type { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { FeedCacheService } from '../services/feed-cache.service';
import { FeedResponseDto, FeedItemDto } from '../dto/feed-response.dto';

@QueryHandler(GetTrendingFeedQuery)
export class GetTrendingFeedHandler
  implements IQueryHandler<GetTrendingFeedQuery>
{
  constructor(
    @Inject(FEED_REPOSITORY)
    private readonly feedRepository: IFeedRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly feedCacheService: FeedCacheService,
  ) {}

  async execute(query: GetTrendingFeedQuery): Promise<FeedResponseDto> {
    const { cursor, limit, currentUserId } = query;

    // Try cache first (only if no user context needed for like status)
    if (!currentUserId) {
      const cached =
        await this.feedCacheService.getTrendingFeed<FeedResponseDto>(cursor);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const result = await this.feedRepository.getTrendingFeed({
      cursor,
      limit,
    });

    // Map to DTOs with like status
    const items: FeedItemDto[] = await Promise.all(
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

    const response: FeedResponseDto = {
      items,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };

    // Cache the result (only if no user-specific data)
    if (!currentUserId) {
      await this.feedCacheService.setTrendingFeed(cursor, response);
    }

    return response;
  }
}
