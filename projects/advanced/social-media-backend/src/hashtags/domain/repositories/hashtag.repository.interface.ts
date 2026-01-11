import { HashtagEntity } from '../../../shared/persistence/entities/hashtag.entity';
import { PostEntity } from '../../../shared/persistence/entities/post.entity';

export const HASHTAG_REPOSITORY = Symbol('HASHTAG_REPOSITORY');

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IHashtagRepository {
  findByTag(tag: string): Promise<HashtagEntity | null>;
  getTrending(limit: number): Promise<HashtagEntity[]>;
  getPostsByHashtag(
    tag: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PostEntity>>;
}
