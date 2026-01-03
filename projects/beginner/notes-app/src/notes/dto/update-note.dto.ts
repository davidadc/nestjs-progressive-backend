import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({
    example: 'Updated Title',
    description: 'Note title',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated content.',
    description: 'Note content',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
