import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

export class PaginationMetaDto {
  @ApiPropertyOptional({ example: 1 })
  page: number;

  @ApiPropertyOptional({ example: 10 })
  limit: number;

  @ApiPropertyOptional({ example: 100 })
  total: number;

  @ApiPropertyOptional({ example: 10 })
  pages: number;
}
