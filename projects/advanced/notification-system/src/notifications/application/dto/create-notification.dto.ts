import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { NOTIFICATION_TYPES } from '../../domain/value-objects/notification-type.vo';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NOTIFICATION_TYPES,
    example: 'new_comment',
  })
  @IsEnum(NOTIFICATION_TYPES)
  type: NotificationTypeValue;

  @ApiProperty({
    description: 'Notification title',
    example: 'New comment on your post',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'John Doe commented: "Great article!"',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { postId: 'post-123', commentId: 'comment-456' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
