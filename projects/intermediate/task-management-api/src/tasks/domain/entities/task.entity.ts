import { User } from '../../../users/domain/entities/user.entity';
import { Project } from '../../../projects/domain/entities/project.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class Task {
  id: string;
  projectId: string;
  project?: Project;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Task>) {
    Object.assign(this, partial);
  }

  isAssignedTo(userId: string): boolean {
    return this.assignedToId === userId;
  }

  isCreatedBy(userId: string): boolean {
    return this.createdById === userId;
  }

  canUserModify(userId: string, userRole: string): boolean {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') return true;
    return this.isAssignedTo(userId);
  }

  canUserUpdateStatus(userId: string, userRole: string): boolean {
    if (userRole === 'ADMIN' || userRole === 'MANAGER') return true;
    return this.isAssignedTo(userId);
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== TaskStatus.DONE;
  }

  isDone(): boolean {
    return this.status === TaskStatus.DONE;
  }
}
