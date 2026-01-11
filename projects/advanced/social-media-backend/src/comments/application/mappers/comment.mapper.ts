import { CommentEntity } from '../../../shared/persistence/entities/comment.entity';
import { Comment } from '../../domain/aggregates/comment.aggregate';
import {
  CommentResponseDto,
  CommentAuthorDto,
} from '../dto/comment-response.dto';

export class CommentMapper {
  /**
   * Convert Comment aggregate to CommentEntity for persistence
   */
  static toPersistence(aggregate: Comment): Partial<CommentEntity> {
    return {
      id: aggregate.id.value,
      postId: aggregate.postId,
      userId: aggregate.userId,
      content: aggregate.content,
      likesCount: aggregate.likesCount,
    };
  }

  /**
   * Convert CommentEntity to Comment aggregate (domain model)
   */
  static toDomain(entity: CommentEntity): Comment {
    return Comment.reconstitute({
      id: entity.id,
      postId: entity.postId,
      userId: entity.userId,
      content: entity.content,
      likesCount: entity.likesCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert CommentEntity to CommentResponseDto (for API responses)
   */
  static toResponseDto(entity: CommentEntity): CommentResponseDto {
    const author: CommentAuthorDto = entity.user
      ? {
          id: entity.user.id,
          username: entity.user.username,
          name: entity.user.name,
          avatar: entity.user.avatar,
        }
      : {
          id: entity.userId,
          username: '',
          name: '',
          avatar: undefined,
        };

    return {
      id: entity.id,
      postId: entity.postId,
      content: entity.content,
      likesCount: entity.likesCount,
      author,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert Comment aggregate to CommentResponseDto (for API responses)
   */
  static aggregateToResponseDto(
    aggregate: Comment,
    author: CommentAuthorDto,
  ): CommentResponseDto {
    return {
      id: aggregate.id.value,
      postId: aggregate.postId,
      content: aggregate.content,
      likesCount: aggregate.likesCount,
      author,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt,
    };
  }
}
