import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  updatedAt: string;
}
