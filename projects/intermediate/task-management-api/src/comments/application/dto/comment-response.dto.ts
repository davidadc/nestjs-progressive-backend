import { ApiProperty } from '@nestjs/swagger';

export class CommentUserDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

export class CommentResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  taskId: string;

  @ApiProperty({ type: CommentUserDto, required: false })
  user?: CommentUserDto;

  @ApiProperty({ example: 'Great progress on this task!' })
  content: string;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  updatedAt: string;
}
