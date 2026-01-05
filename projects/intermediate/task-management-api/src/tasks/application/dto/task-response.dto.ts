import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../domain/enums/task-status.enum';
import { TaskPriority } from '../../domain/enums/task-priority.enum';

export class TaskUserDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

export class TaskProjectDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Q1 Planning Project' })
  name: string;
}

export class TaskResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  projectId: string;

  @ApiPropertyOptional({ type: TaskProjectDto })
  project?: TaskProjectDto;

  @ApiProperty({ example: 'Implement user authentication' })
  title: string;

  @ApiPropertyOptional({ example: 'Add JWT-based authentication to the API' })
  description?: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: '2026-01-15T00:00:00Z' })
  dueDate?: string;

  @ApiPropertyOptional({ type: TaskUserDto })
  assignedTo?: TaskUserDto;

  @ApiPropertyOptional({ type: TaskUserDto })
  createdBy?: TaskUserDto;

  @ApiProperty({ example: 5 })
  commentCount?: number;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  updatedAt: string;
}
