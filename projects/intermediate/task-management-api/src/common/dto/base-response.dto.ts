import { ApiProperty } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  timestamp: string;

  @ApiProperty({ example: '1.0' })
  version: string;
}

export class BaseResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty()
  data: T;

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}
