import { PostEntity } from '../../../shared/persistence/entities/post.entity';
import { Post } from '../../domain/aggregates/post.aggregate';
import {
  PostResponseDto,
  PostAuthorDto,
  PostSummaryDto,
  LikeUserDto,
} from '../dto/post-response.dto';
import { LikeEntity } from '../../../shared/persistence/entities/like.entity';

export class PostMapper {
  /**
   * Convert Post aggregate to PostEntity for persistence
   */
  static toPersistence(aggregate: Post): Partial<PostEntity> {
    return {
      id: aggregate.id.value,
      authorId: aggregate.authorId,
      content: aggregate.content,
      images: aggregate.images,
      likesCount: aggregate.likesCount,
      commentsCount: aggregate.commentsCount,
    };
  }

  /**
   * Convert PostEntity to Post aggregate (domain model)
   */
  static toDomain(entity: PostEntity): Post {
    return Post.reconstitute({
      id: entity.id,
      authorId: entity.authorId,
      content: entity.content,
      images: entity.images,
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert PostEntity to PostResponseDto (for API responses)
   */
  static toResponseDto(entity: PostEntity, isLiked?: boolean): PostResponseDto {
    const author: PostAuthorDto = entity.author
      ? {
          id: entity.author.id,
          username: entity.author.username,
          name: entity.author.name,
          avatar: entity.author.avatar,
        }
      : {
          id: entity.authorId,
          username: '',
          name: '',
          avatar: undefined,
        };

    return {
      id: entity.id,
      content: entity.content,
      images: entity.images,
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      author,
      isLiked,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert Post aggregate to PostResponseDto (for API responses)
   */
  static aggregateToResponseDto(
    aggregate: Post,
    author: PostAuthorDto,
    isLiked?: boolean,
  ): PostResponseDto {
    return {
      id: aggregate.id.value,
      content: aggregate.content,
      images: aggregate.images,
      likesCount: aggregate.likesCount,
      commentsCount: aggregate.commentsCount,
      author,
      isLiked,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt,
    };
  }

  /**
   * Convert PostEntity to PostSummaryDto (for lists)
   */
  static toSummaryDto(entity: PostEntity): PostSummaryDto {
    return {
      id: entity.id,
      content: entity.content,
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Convert LikeEntity to LikeUserDto
   */
  static toLikeUserDto(like: LikeEntity): LikeUserDto {
    return {
      id: like.user.id,
      username: like.user.username,
      name: like.user.name,
      avatar: like.user.avatar,
      likedAt: like.createdAt,
    };
  }
}
