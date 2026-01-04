import { Injectable } from '@nestjs/common';
import { Task } from '../../domain/entities/task.entity';
import { TaskResponseDto, TaskUserDto, TaskProjectDto } from '../dto/task-response.dto';
import { User } from '../../../users/domain/entities/user.entity';
import { Project } from '../../../projects/domain/entities/project.entity';

@Injectable()
export class TaskMapper {
  toResponseDto(task: Task, commentCount?: number): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      project: task.project ? this.toProjectDto(task.project) : undefined,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString(),
      assignedTo: task.assignedTo ? this.toUserDto(task.assignedTo) : undefined,
      createdBy: task.createdBy ? this.toUserDto(task.createdBy) : undefined,
      commentCount,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  toResponseDtoList(tasks: Task[]): TaskResponseDto[] {
    return tasks.map((task) => this.toResponseDto(task));
  }

  private toUserDto(user: User): TaskUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private toProjectDto(project: Project): TaskProjectDto {
    return {
      id: project.id,
      name: project.name,
    };
  }
}
