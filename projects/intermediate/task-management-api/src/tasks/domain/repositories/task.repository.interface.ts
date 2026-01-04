import { Task } from '../entities/task.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedToId?: string;
  createdById: string;
}

export interface FindTasksFilter {
  projectId?: string;
  assignedToId?: string;
  createdById?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export interface FindTasksOptions {
  filter?: FindTasksFilter;
  sort?: {
    field: 'createdAt' | 'dueDate' | 'priority' | 'status';
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface PaginatedTasks {
  items: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ITaskRepository {
  create(data: CreateTaskData): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findByIdWithRelations(id: string): Promise<Task | null>;
  findByProjectId(projectId: string): Promise<Task[]>;
  findByAssignedToId(assignedToId: string): Promise<Task[]>;
  findAll(options?: FindTasksOptions): Promise<PaginatedTasks>;
  update(id: string, data: Partial<Task>): Promise<Task>;
  updateStatus(id: string, status: TaskStatus): Promise<Task>;
  delete(id: string): Promise<void>;
  countByProjectId(projectId: string): Promise<number>;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
