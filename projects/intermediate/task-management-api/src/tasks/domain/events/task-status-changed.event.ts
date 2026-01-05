import { TaskStatus } from '../enums/task-status.enum';

export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly previousStatus: TaskStatus,
    public readonly newStatus: TaskStatus,
    public readonly changedById: string,
    public readonly assignedToId?: string,
  ) {}
}

export class TaskAssignedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly assignedToId: string,
    public readonly assignedById: string,
  ) {}
}

export class TaskCreatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly createdById: string,
    public readonly assignedToId?: string,
  ) {}
}
