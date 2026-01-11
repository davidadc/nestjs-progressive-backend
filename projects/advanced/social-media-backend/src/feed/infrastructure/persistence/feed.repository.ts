import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IFeedRepository,
  CursorPaginationOptions,
  CursorPaginatedResult,
} from '../../domain/repositories/feed.repository.interface';
import { PostEntity } from '../../../shared/persistence/entities/post.entity';
import { FollowEntity } from '../../../shared/persistence/entities/follow.entity';

@Injectable()
export class FeedRepository implements IFeedRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  async getFollowingIds(userId: string): Promise<string[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      select: ['followingId'],
    });
    return follows.map((f) => f.followingId);
  }

  async getPersonalizedFeed(
    userId: string,
    options: CursorPaginationOptions,
  ): Promise<CursorPaginatedResult<PostEntity>> {
    const { cursor, limit } = options;

    // Get users that the current user follows
    const followingIds = await this.getFollowingIds(userId);

    // Include own posts in feed
    const authorIds = [...followingIds, userId];

    if (authorIds.length === 0) {
      return {
        items: [],
        hasMore: false,
      };
    }

    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.authorId IN (:...authorIds)', { authorIds })
      .orderBy('post.createdAt', 'DESC')
      .take(limit + 1); // Fetch one extra to check if there are more

    // Apply cursor (cursor is the createdAt timestamp of the last item)
    if (cursor) {
      queryBuilder.andWhere('post.createdAt < :cursor', {
        cursor: new Date(cursor),
      });
    }

    const posts = await queryBuilder.getMany();

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : undefined;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async getTrendingFeed(
    options: CursorPaginationOptions,
  ): Promise<CursorPaginatedResult<PostEntity>> {
    const { cursor, limit } = options;

    // Trending algorithm: posts with high engagement (likes + comments)
    // from the last 7 days, ordered by engagement score
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .addSelect(
        '(post.likesCount + post.commentsCount * 2)',
        'engagement_score',
      )
      .orderBy('engagement_score', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit + 1);

    // For trending, cursor is the post ID with offset
    if (cursor) {
      // Parse cursor as "offset" for trending feed
      const offset = parseInt(cursor, 10);
      if (!isNaN(offset)) {
        queryBuilder.skip(offset);
      }
    }

    const posts = await queryBuilder.getMany();

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    // Calculate next cursor (offset-based for trending)
    let nextCursor: string | undefined;
    if (hasMore) {
      const currentOffset = cursor ? parseInt(cursor, 10) : 0;
      nextCursor = String(currentOffset + limit);
    }

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}
