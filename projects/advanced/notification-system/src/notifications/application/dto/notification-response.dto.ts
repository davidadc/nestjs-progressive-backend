import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'new_comment',
  })
  type: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New comment on your post',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'John Doe commented: "Great article!"',
  })
  message: string;

  @ApiProperty({
    description: 'Additional data payload',
    example: { postId: 'post-123', commentId: 'comment-456' },
  })
  data: Record<string, unknown>;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  read: boolean;

  @ApiPropertyOptional({
    description: 'When the notification was read',
    example: '2026-01-11T10:05:00Z',
    nullable: true,
  })
  readAt: string | null;

  @ApiProperty({
    description: 'When the notification was created',
    example: '2026-01-11T10:00:00Z',
  })
  createdAt: string;
}
