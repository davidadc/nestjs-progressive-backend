import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../../users/application/dto/user-response.dto';

export class ProjectMemberDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'USER' })
  role: string;
}

export class ProjectResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Q1 Planning Project' })
  name: string;

  @ApiPropertyOptional({ example: 'Project for Q1 2026 planning activities' })
  description?: string;

  @ApiProperty({ example: 'uuid-string' })
  ownerId: string;

  @ApiPropertyOptional({ type: ProjectMemberDto })
  owner?: ProjectMemberDto;

  @ApiPropertyOptional({ type: [ProjectMemberDto] })
  members?: ProjectMemberDto[];

  @ApiProperty({ example: 5 })
  taskCount?: number;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  updatedAt: string;
}
