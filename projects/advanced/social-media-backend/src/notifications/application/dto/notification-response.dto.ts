import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationActorDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatar?: string;
}

export class NotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['follow', 'like', 'comment'],
  })
  type: 'follow' | 'like' | 'comment';

  @ApiProperty({ description: 'Actor who triggered the notification' })
  actor: NotificationActorDto;

  @ApiProperty({ description: 'Target entity ID (post, comment, or user)' })
  targetId: string;

  @ApiProperty({ description: 'Whether notification has been read' })
  read: boolean;

  @ApiProperty({ description: 'Notification creation timestamp' })
  createdAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationDto], description: 'List of notifications' })
  items: NotificationDto[];

  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Number of unread notifications' })
  unreadCount: number;
}
