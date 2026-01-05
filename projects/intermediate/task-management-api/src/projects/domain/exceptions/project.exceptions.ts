import { NotFoundException, ForbiddenException } from '@nestjs/common';

export class ProjectNotFoundException extends NotFoundException {
  constructor(projectId: string) {
    super(`Project with ID '${projectId}' not found`);
  }
}

export class ProjectAccessDeniedException extends ForbiddenException {
  constructor(message = 'You do not have access to this project') {
    super(message);
  }
}

export class NotProjectOwnerException extends ForbiddenException {
  constructor() {
    super('Only the project owner can perform this action');
  }
}

export class UserAlreadyMemberException extends ForbiddenException {
  constructor() {
    super('User is already a member of this project');
  }
}

export class UserNotMemberException extends NotFoundException {
  constructor() {
    super('User is not a member of this project');
  }
}
