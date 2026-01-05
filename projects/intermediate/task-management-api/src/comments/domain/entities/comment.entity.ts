import { User } from '../../../users/domain/entities/user.entity';
import { Task } from '../../../tasks/domain/entities/task.entity';

export class TaskComment {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  user?: User;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TaskComment>) {
    Object.assign(this, partial);
  }

  isAuthor(userId: string): boolean {
    return this.userId === userId;
  }

  canUserModify(userId: string, userRole: string): boolean {
    if (userRole === 'ADMIN') return true;
    return this.isAuthor(userId);
  }

  canUserDelete(userId: string, userRole: string): boolean {
    if (userRole === 'ADMIN') return true;
    return this.isAuthor(userId);
  }
}
