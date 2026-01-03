import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: 'My First Note',
    description: 'Note title',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @ApiPropertyOptional({
    example: 'This is the content of my note.',
    description: 'Note content (optional)',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
