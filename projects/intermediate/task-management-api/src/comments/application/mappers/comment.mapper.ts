import { Injectable } from '@nestjs/common';
import { TaskComment } from '../../domain/entities/comment.entity';
import {
  CommentResponseDto,
  CommentUserDto,
} from '../dto/comment-response.dto';
import { User } from '../../../users/domain/entities/user.entity';

@Injectable()
export class CommentMapper {
  toResponseDto(comment: TaskComment): CommentResponseDto {
    return {
      id: comment.id,
      taskId: comment.taskId,
      user: comment.user ? this.toUserDto(comment.user) : undefined,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  toResponseDtoList(comments: TaskComment[]): CommentResponseDto[] {
    return comments.map((comment) => this.toResponseDto(comment));
  }

  private toUserDto(user: User): CommentUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
