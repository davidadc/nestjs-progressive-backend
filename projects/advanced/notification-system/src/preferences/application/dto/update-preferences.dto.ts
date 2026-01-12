import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChannelPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;
}

export class PerTypePreferencesDto {
  @ApiPropertyOptional({ type: ChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  order_completed?: ChannelPreferencesDto;

  @ApiPropertyOptional({ type: ChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  new_comment?: ChannelPreferencesDto;

  @ApiPropertyOptional({ type: ChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  new_follower?: ChannelPreferencesDto;

  @ApiPropertyOptional({ type: ChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  liked_post?: ChannelPreferencesDto;

  @ApiPropertyOptional({ type: ChannelPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferencesDto)
  mention?: ChannelPreferencesDto;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    description: 'Enable email notifications globally',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({
    description: 'Enable push notifications globally',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiPropertyOptional({
    description: 'Enable SMS notifications globally',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({
    description: 'Per notification type preferences',
    type: PerTypePreferencesDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PerTypePreferencesDto)
  perType?: PerTypePreferencesDto;
}
