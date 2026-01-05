import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TaskCreatedEvent,
  TaskAssignedEvent,
  TaskStatusChangedEvent,
} from '../../domain/events/task-status-changed.event';
import { TaskStatus } from '../../domain/enums/task-status.enum';

@Injectable()
export class TaskEventsListener {
  private readonly logger = new Logger(TaskEventsListener.name);

  @OnEvent('task.created')
  handleTaskCreated(event: TaskCreatedEvent): void {
    this.logger.log(
      `Task created: ${event.taskId} in project ${event.projectId} by user ${event.createdById}` +
        (event.assignedToId ? ` (assigned to ${event.assignedToId})` : ''),
    );

    // Future: Send notification to project members
    // Future: Update project activity feed
    // Future: Send email to assignee if assigned
  }

  @OnEvent('task.assigned')
  handleTaskAssigned(event: TaskAssignedEvent): void {
    this.logger.log(
      `Task assigned: ${event.taskId} to user ${event.assignedToId} by ${event.assignedById}`,
    );

    // Future: Send push notification to assignee
    // Future: Send email notification to assignee
    // Future: Update user's task queue/dashboard
  }

  @OnEvent('task.status.changed')
  handleTaskStatusChanged(event: TaskStatusChangedEvent): void {
    this.logger.log(
      `Task status changed: ${event.taskId} from ${event.previousStatus} to ${event.newStatus} by ${event.changedById}`,
    );

    // Future: Notify project manager if task is blocked
    // Future: Send notification to task creator when completed
    // Future: Update project progress metrics
    // Future: Trigger workflow automations (e.g., move to next stage)

    if (event.newStatus === TaskStatus.DONE) {
      this.logger.log(`Task ${event.taskId} completed!`);
      // Future: Send completion notification to stakeholders
      // Future: Update sprint/milestone progress
    }
  }
}
