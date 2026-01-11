import { ApiProperty } from '@nestjs/swagger';

export class HashtagResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'photography' })
  tag: string;

  @ApiProperty({ example: 150 })
  usageCount: number;
}

export class TrendingHashtagDto {
  @ApiProperty({ example: 'photography' })
  tag: string;

  @ApiProperty({ example: 150 })
  usageCount: number;

  @ApiProperty({ example: 1 })
  rank: number;
}
