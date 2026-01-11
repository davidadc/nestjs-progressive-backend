import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar?: string;

  @ApiProperty({
    description: 'User bio',
    example: 'Software developer passionate about NestJS',
    nullable: true,
  })
  bio?: string;

  @ApiProperty({
    description: 'Number of followers',
    example: 150,
  })
  followersCount: number;

  @ApiProperty({
    description: 'Number of users following',
    example: 75,
  })
  followingCount: number;

  @ApiProperty({
    description: 'Number of posts',
    example: 42,
  })
  postsCount: number;

  @ApiProperty({
    description: 'Account creation date',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Whether the current user is following this user',
    example: true,
    required: false,
  })
  isFollowing?: boolean;
}

export class UserSummaryDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar?: string;
}
