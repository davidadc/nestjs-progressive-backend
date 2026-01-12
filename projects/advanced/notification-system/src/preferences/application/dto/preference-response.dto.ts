import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChannelPreferencesResponseDto {
  @ApiProperty({ example: true })
  email: boolean;

  @ApiProperty({ example: true })
  push: boolean;

  @ApiProperty({ example: false })
  sms: boolean;
}

export class PerTypePreferencesResponseDto {
  @ApiPropertyOptional({ type: ChannelPreferencesResponseDto })
  order_completed?: ChannelPreferencesResponseDto;

  @ApiPropertyOptional({ type: ChannelPreferencesResponseDto })
  new_comment?: ChannelPreferencesResponseDto;

  @ApiPropertyOptional({ type: ChannelPreferencesResponseDto })
  new_follower?: ChannelPreferencesResponseDto;

  @ApiPropertyOptional({ type: ChannelPreferencesResponseDto })
  liked_post?: ChannelPreferencesResponseDto;

  @ApiPropertyOptional({ type: ChannelPreferencesResponseDto })
  mention?: ChannelPreferencesResponseDto;
}

export class PreferenceResponseDto {
  @ApiProperty({
    description: 'Preference ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId: string;

  @ApiProperty({
    description: 'Global email notification setting',
    example: true,
  })
  email: boolean;

  @ApiProperty({
    description: 'Global push notification setting',
    example: true,
  })
  push: boolean;

  @ApiProperty({
    description: 'Global SMS notification setting',
    example: false,
  })
  sms: boolean;

  @ApiProperty({
    description: 'Per notification type preferences',
    type: PerTypePreferencesResponseDto,
  })
  perType: PerTypePreferencesResponseDto;
}
