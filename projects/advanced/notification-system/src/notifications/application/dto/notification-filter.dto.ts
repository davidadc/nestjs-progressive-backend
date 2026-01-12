import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NOTIFICATION_TYPES } from '../../domain/value-objects/notification-type.vo';
import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';

export class NotificationFilterDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by read status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NOTIFICATION_TYPES,
  })
  @IsOptional()
  @IsEnum(NOTIFICATION_TYPES)
  type?: NotificationTypeValue;
}
