import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatus } from '../../domain/enums/task-status.enum';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
