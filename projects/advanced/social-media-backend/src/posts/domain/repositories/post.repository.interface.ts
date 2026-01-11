import { PostEntity } from '../../../shared/persistence/entities/post.entity';
import { LikeEntity } from '../../../shared/persistence/entities/like.entity';
import { HashtagEntity } from '../../../shared/persistence/entities/hashtag.entity';

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');

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

export interface IPostRepository {
  // Post operations
  findById(id: string): Promise<PostEntity | null>;
  findByIdWithAuthor(id: string): Promise<PostEntity | null>;
  findByAuthor(
    authorId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PostEntity>>;
  save(post: PostEntity): Promise<PostEntity>;
  delete(id: string): Promise<void>;

  // Like operations
  findLike(userId: string, postId: string): Promise<LikeEntity | null>;
  createLike(userId: string, postId: string): Promise<LikeEntity>;
  deleteLike(userId: string, postId: string): Promise<void>;
  getPostLikes(
    postId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<LikeEntity>>;

  // Counter operations
  incrementLikesCount(postId: string): Promise<void>;
  decrementLikesCount(postId: string): Promise<void>;
  incrementCommentsCount(postId: string): Promise<void>;
  decrementCommentsCount(postId: string): Promise<void>;
  incrementPostsCount(authorId: string): Promise<void>;
  decrementPostsCount(authorId: string): Promise<void>;

  // Hashtag operations
  findOrCreateHashtags(tags: string[]): Promise<HashtagEntity[]>;
  incrementHashtagUsage(hashtagId: string): Promise<void>;
  decrementHashtagUsage(hashtagId: string): Promise<void>;
}
