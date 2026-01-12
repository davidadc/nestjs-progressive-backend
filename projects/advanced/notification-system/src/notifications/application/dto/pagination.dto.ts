import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 45 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  pages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Request success status' })
  success: boolean;

  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  data: T[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}
