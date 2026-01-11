import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { FollowEntity } from '../../../shared/persistence/entities/follow.entity';

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

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;

  // Follow operations
  findFollow(followerId: string, followingId: string): Promise<FollowEntity | null>;
  createFollow(followerId: string, followingId: string): Promise<FollowEntity>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;

  // Follower/Following queries
  getFollowers(userId: string, options: PaginationOptions): Promise<PaginatedResult<UserEntity>>;
  getFollowing(userId: string, options: PaginationOptions): Promise<PaginatedResult<UserEntity>>;

  // Search
  searchUsers(query: string, options: PaginationOptions): Promise<PaginatedResult<UserEntity>>;

  // Counter updates
  incrementFollowersCount(userId: string): Promise<void>;
  decrementFollowersCount(userId: string): Promise<void>;
  incrementFollowingCount(userId: string): Promise<void>;
  decrementFollowingCount(userId: string): Promise<void>;
}
