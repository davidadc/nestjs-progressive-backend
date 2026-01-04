import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great progress on this task!' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
