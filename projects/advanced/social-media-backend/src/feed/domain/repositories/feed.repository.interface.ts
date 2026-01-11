import { PostEntity } from '../../../shared/persistence/entities/post.entity';

export const FEED_REPOSITORY = Symbol('FEED_REPOSITORY');

export interface CursorPaginationOptions {
  cursor?: string; // ISO date string or post ID
  limit: number;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface IFeedRepository {
  getPersonalizedFeed(
    userId: string,
    options: CursorPaginationOptions,
  ): Promise<CursorPaginatedResult<PostEntity>>;

  getTrendingFeed(
    options: CursorPaginationOptions,
  ): Promise<CursorPaginatedResult<PostEntity>>;

  getFollowingIds(userId: string): Promise<string[]>;
}
