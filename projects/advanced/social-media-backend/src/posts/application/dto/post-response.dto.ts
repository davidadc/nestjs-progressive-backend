import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostAuthorDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;
}

export class PostResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Check out this amazing sunset! #photography' })
  content: string;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  images?: string[];

  @ApiProperty({ example: 42 })
  likesCount: number;

  @ApiProperty({ example: 5 })
  commentsCount: number;

  @ApiProperty({ type: PostAuthorDto })
  author: PostAuthorDto;

  @ApiPropertyOptional({
    description: 'Whether the current user has liked this post',
    example: true,
  })
  isLiked?: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class PostSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Check out this amazing sunset! #photography' })
  content: string;

  @ApiProperty({ example: 42 })
  likesCount: number;

  @ApiProperty({ example: 5 })
  commentsCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

export class LikeUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  likedAt: Date;
}
