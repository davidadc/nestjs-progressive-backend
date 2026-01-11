import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { User } from '../../domain/aggregates/user.aggregate';
import { UserResponseDto, UserSummaryDto } from '../dto/user-response.dto';

export class UserMapper {
  /**
   * Convert User aggregate to UserEntity for persistence
   */
  static toPersistence(aggregate: User): Partial<UserEntity> {
    return {
      id: aggregate.id.value,
      email: aggregate.email,
      username: aggregate.username,
      name: aggregate.name,
      password: aggregate.password,
      avatar: aggregate.avatar,
      bio: aggregate.bio,
      followersCount: aggregate.followersCount,
      followingCount: aggregate.followingCount,
      postsCount: aggregate.postsCount,
    };
  }

  /**
   * Convert UserEntity to User aggregate (domain model)
   */
  static toDomain(entity: UserEntity): User {
    return User.reconstitute({
      id: entity.id,
      email: entity.email,
      username: entity.username,
      name: entity.name,
      password: entity.password,
      avatar: entity.avatar,
      bio: entity.bio,
      followersCount: entity.followersCount,
      followingCount: entity.followingCount,
      postsCount: entity.postsCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert UserEntity to UserResponseDto (for API responses)
   */
  static toResponseDto(
    entity: UserEntity,
    isFollowing?: boolean,
  ): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      username: entity.username,
      name: entity.name,
      avatar: entity.avatar,
      bio: entity.bio,
      followersCount: entity.followersCount,
      followingCount: entity.followingCount,
      postsCount: entity.postsCount,
      createdAt: entity.createdAt,
      isFollowing,
    };
  }

  /**
   * Convert User aggregate to UserResponseDto (for API responses)
   */
  static aggregateToResponseDto(
    aggregate: User,
    isFollowing?: boolean,
  ): UserResponseDto {
    return {
      id: aggregate.id.value,
      email: aggregate.email,
      username: aggregate.username,
      name: aggregate.name,
      avatar: aggregate.avatar,
      bio: aggregate.bio,
      followersCount: aggregate.followersCount,
      followingCount: aggregate.followingCount,
      postsCount: aggregate.postsCount,
      createdAt: aggregate.createdAt,
      isFollowing,
    };
  }

  /**
   * Convert UserEntity to UserSummaryDto (for lists)
   */
  static toSummaryDto(entity: UserEntity): UserSummaryDto {
    return {
      id: entity.id,
      username: entity.username,
      name: entity.name,
      avatar: entity.avatar,
    };
  }

  /**
   * Convert User aggregate to UserSummaryDto (for lists)
   */
  static aggregateToSummaryDto(aggregate: User): UserSummaryDto {
    return {
      id: aggregate.id.value,
      username: aggregate.username,
      name: aggregate.name,
      avatar: aggregate.avatar,
    };
  }
}
