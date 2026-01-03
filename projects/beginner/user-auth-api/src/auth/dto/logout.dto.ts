import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Optional refresh token to invalidate. If not provided, all refresh tokens for the user will be invalidated.',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
