import { ApiProperty } from '@nestjs/swagger';
import { MetaDto } from './base-response.dto';
import { PaginationMetaDto } from './pagination.dto';

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}
