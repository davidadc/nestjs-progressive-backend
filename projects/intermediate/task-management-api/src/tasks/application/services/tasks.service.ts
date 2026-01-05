import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  type ITaskRepository,
  TASK_REPOSITORY,
  type FindTasksOptions,
} from '../../domain/repositories/task.repository.interface';
import {
  type IProjectRepository,
  PROJECT_REPOSITORY,
} from '../../../projects/domain/repositories/project.repository.interface';
import {
  type ICommentRepository,
  COMMENT_REPOSITORY,
} from '../../../comments/domain/repositories/comment.repository.interface';
import { Task } from '../../domain/entities/task.entity';
import { TaskStatus } from '../../domain/enums/task-status.enum';
import { User } from '../../../users/domain/entities/user.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { FindTasksDto } from '../dto/find-tasks.dto';
import { TaskResponseDto } from '../dto/task-response.dto';
import { TaskMapper } from '../mappers/task.mapper';
import {
  TaskNotFoundException,
  TaskAccessDeniedException,
  TaskModificationDeniedException,
} from '../../domain/exceptions/task.exceptions';
import {
  ProjectNotFoundException,
  ProjectAccessDeniedException,
} from '../../../projects/domain/exceptions/project.exceptions';
import {
  TaskStatusChangedEvent,
  TaskCreatedEvent,
  TaskAssignedEvent,
} from '../../domain/events/task-status-changed.event';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: ICommentRepository,
    private readonly taskMapper: TaskMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    projectId: string,
    dto: CreateTaskDto,
    currentUser: User,
  ): Promise<TaskResponseDto> {
    const project = await this.projectRepository.findByIdWithMembers(projectId);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    if (!project.isMember(currentUser.id)) {
      throw new ProjectAccessDeniedException();
    }

    if (!currentUser.canManageTasks()) {
      throw new TaskModificationDeniedException();
    }

    const task = await this.taskRepository.create({
      projectId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedToId: dto.assignedToId,
      createdById: currentUser.id,
    });

    this.eventEmitter.emit(
      'task.created',
      new TaskCreatedEvent(
        task.id,
        projectId,
        currentUser.id,
        dto.assignedToId,
      ),
    );

    if (dto.assignedToId) {
      this.eventEmitter.emit(
        'task.assigned',
        new TaskAssignedEvent(
          task.id,
          projectId,
          dto.assignedToId,
          currentUser.id,
        ),
      );
    }

    const taskWithRelations = await this.taskRepository.findByIdWithRelations(
      task.id,
    );
    return this.taskMapper.toResponseDto(taskWithRelations!);
  }

  async findById(id: string, currentUser: User): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findByIdWithRelations(id);
    if (!task) {
      throw new TaskNotFoundException(id);
    }

    const project = await this.projectRepository.findByIdWithMembers(
      task.projectId,
    );
    if (!project?.isMember(currentUser.id)) {
      throw new TaskAccessDeniedException();
    }

    const commentCount = await this.commentRepository.countByTaskId(id);
    return this.taskMapper.toResponseDto(task, commentCount);
  }

  async findAll(
    query: FindTasksDto,
    currentUser: User,
  ): Promise<{ items: TaskResponseDto[]; pagination: any }> {
    const filter: FindTasksOptions['filter'] = {};

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.projectId) filter.projectId = query.projectId;
    if (query.search) filter.search = query.search;

    if (query.assignedTo === 'me') {
      filter.assignedToId = currentUser.id;
    } else if (query.assignedTo) {
      filter.assignedToId = query.assignedTo;
    }

    const result = await this.taskRepository.findAll({
      filter,
      sort: query.sort
        ? { field: query.sort, order: query.order || 'desc' }
        : undefined,
      pagination: { page: query.page || 1, limit: query.limit || 10 },
    });

    // Filter tasks to only those in projects the user has access to
    const accessibleTasks: Task[] = [];
    for (const task of result.items) {
      const project = await this.projectRepository.findByIdWithMembers(
        task.projectId,
      );
      if (project?.isMember(currentUser.id)) {
        accessibleTasks.push(task);
      }
    }

    return {
      items: this.taskMapper.toResponseDtoList(accessibleTasks),
      pagination: result.pagination,
    };
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    currentUser: User,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findByIdWithRelations(id);
    if (!task) {
      throw new TaskNotFoundException(id);
    }

    const project = await this.projectRepository.findByIdWithMembers(
      task.projectId,
    );
    if (!project?.isMember(currentUser.id)) {
      throw new TaskAccessDeniedException();
    }

    if (!task.canUserModify(currentUser.id, currentUser.role)) {
      throw new TaskModificationDeniedException();
    }

    const previousStatus = task.status;
    const updateData: Partial<Task> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.assignedToId !== undefined)
      updateData.assignedToId = dto.assignedToId;

    await this.taskRepository.update(id, updateData);

    if (dto.status && dto.status !== previousStatus) {
      this.eventEmitter.emit(
        'task.status.changed',
        new TaskStatusChangedEvent(
          id,
          task.projectId,
          previousStatus,
          dto.status,
          currentUser.id,
          task.assignedToId,
        ),
      );
    }

    if (dto.assignedToId && dto.assignedToId !== task.assignedToId) {
      this.eventEmitter.emit(
        'task.assigned',
        new TaskAssignedEvent(
          id,
          task.projectId,
          dto.assignedToId,
          currentUser.id,
        ),
      );
    }

    const taskWithRelations =
      await this.taskRepository.findByIdWithRelations(id);
    return this.taskMapper.toResponseDto(taskWithRelations!);
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    currentUser: User,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findByIdWithRelations(id);
    if (!task) {
      throw new TaskNotFoundException(id);
    }

    const project = await this.projectRepository.findByIdWithMembers(
      task.projectId,
    );
    if (!project?.isMember(currentUser.id)) {
      throw new TaskAccessDeniedException();
    }

    if (!task.canUserUpdateStatus(currentUser.id, currentUser.role)) {
      throw new TaskModificationDeniedException();
    }

    const previousStatus = task.status;
    await this.taskRepository.updateStatus(id, status);

    this.eventEmitter.emit(
      'task.status.changed',
      new TaskStatusChangedEvent(
        id,
        task.projectId,
        previousStatus,
        status,
        currentUser.id,
        task.assignedToId,
      ),
    );

    const taskWithRelations =
      await this.taskRepository.findByIdWithRelations(id);
    return this.taskMapper.toResponseDto(taskWithRelations!);
  }

  async delete(id: string, currentUser: User): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new TaskNotFoundException(id);
    }

    const project = await this.projectRepository.findByIdWithMembers(
      task.projectId,
    );
    if (!project?.isMember(currentUser.id)) {
      throw new TaskAccessDeniedException();
    }

    if (!currentUser.canManageTasks()) {
      throw new TaskModificationDeniedException();
    }

    await this.taskRepository.delete(id);
  }
}
