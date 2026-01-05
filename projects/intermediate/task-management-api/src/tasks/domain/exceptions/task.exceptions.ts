import { NotFoundException, ForbiddenException } from '@nestjs/common';

export class TaskNotFoundException extends NotFoundException {
  constructor(taskId: string) {
    super(`Task with ID '${taskId}' not found`);
  }
}

export class TaskAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this task') {
    super(message);
  }
}

export class TaskModificationDeniedException extends ForbiddenException {
  constructor() {
    super('You do not have permission to modify this task');
  }
}

export class InvalidTaskStatusTransitionException extends ForbiddenException {
  constructor(from: string, to: string) {
    super(`Invalid status transition from '${from}' to '${to}'`);
  }
}
