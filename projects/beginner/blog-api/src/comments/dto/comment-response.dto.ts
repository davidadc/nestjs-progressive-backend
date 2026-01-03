import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../entities/comment.entity';

class CommentUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiProperty({ description: 'Comment author', type: CommentUserDto })
  user: CommentUserDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  constructor(comment: Comment) {
    this.id = comment.id;
    this.content = comment.content;
    this.user = {
      id: comment.user.id,
      name: comment.user.name,
    };
    this.createdAt = comment.createdAt;
  }
}
