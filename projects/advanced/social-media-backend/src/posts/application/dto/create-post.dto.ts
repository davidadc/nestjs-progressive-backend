import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post content (supports hashtags with #)',
    example: 'Check out this amazing sunset! #photography #nature',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
