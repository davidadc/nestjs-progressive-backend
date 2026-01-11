import { CommentEntity } from '../../../shared/persistence/entities/comment.entity';
import { LikeEntity } from '../../../shared/persistence/entities/like.entity';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

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

export interface ICommentRepository {
  findById(id: string): Promise<CommentEntity | null>;
  findByIdWithUser(id: string): Promise<CommentEntity | null>;
  findByPost(
    postId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<CommentEntity>>;
  save(comment: CommentEntity): Promise<CommentEntity>;
  delete(id: string): Promise<void>;

  // Like operations
  findLike(userId: string, commentId: string): Promise<LikeEntity | null>;
  createLike(userId: string, commentId: string): Promise<LikeEntity>;
  deleteLike(userId: string, commentId: string): Promise<void>;
  incrementLikesCount(commentId: string): Promise<void>;
  decrementLikesCount(commentId: string): Promise<void>;
}
