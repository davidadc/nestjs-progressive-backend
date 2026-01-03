import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  pages: number;
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ type: PaginationMeta, description: 'Pagination metadata' })
  pagination: PaginationMeta;
}
