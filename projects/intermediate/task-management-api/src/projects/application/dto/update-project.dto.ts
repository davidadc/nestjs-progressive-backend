import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Q1 Planning Project - Updated' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated project description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
