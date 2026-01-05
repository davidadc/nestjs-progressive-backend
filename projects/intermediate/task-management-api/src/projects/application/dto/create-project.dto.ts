import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Q1 Planning Project' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Project for Q1 2026 planning activities' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
