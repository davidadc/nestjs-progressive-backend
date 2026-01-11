import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPersonalizedFeedQuery } from './get-personalized-feed.query';
import type { IFeedRepository } from '../../domain/repositories/feed.repository.interface';
import { FEED_REPOSITORY } from '../../domain/repositories/feed.repository.interface';
import type { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { FeedCacheService } from '../services/feed-cache.service';
import { FeedResponseDto, FeedItemDto } from '../dto/feed-response.dto';

@QueryHandler(GetPersonalizedFeedQuery)
export class GetPersonalizedFeedHandler
  implements IQueryHandler<GetPersonalizedFeedQuery>
{
  constructor(
    @Inject(FEED_REPOSITORY)
    private readonly feedRepository: IFeedRepository,
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly feedCacheService: FeedCacheService,
  ) {}

  async execute(query: GetPersonalizedFeedQuery): Promise<FeedResponseDto> {
    const { userId, cursor, limit } = query;

    // Try cache first
    const cached = await this.feedCacheService.getPersonalizedFeed<FeedResponseDto>(
      userId,
      cursor,
    );
    if (cached) {
      return cached;
    }

    // Fetch from database
    const result = await this.feedRepository.getPersonalizedFeed(userId, {
      cursor,
      limit,
    });

    // Map to DTOs with like status
    const items: FeedItemDto[] = await Promise.all(
      result.items.map(async (post) => {
        const like = await this.postRepository.findLike(userId, post.id);

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
          isLiked: !!like,
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

    // Cache the result
    await this.feedCacheService.setPersonalizedFeed(userId, cursor, response);

    return response;
  }
}
