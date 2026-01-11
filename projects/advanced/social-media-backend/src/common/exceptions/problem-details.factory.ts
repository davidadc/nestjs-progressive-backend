import { HttpStatus } from '@nestjs/common';
import {
  ProblemDetailsException,
  ProblemDetailsPayload,
} from './problem-details.exception';

export class ProblemDetailsFactory {
  static notFound(resource: string, id: string, instance?: string) {
    return ProblemDetailsException.notFound(
      `${resource} with ID '${id}' not found.`,
      instance,
    );
  }

  static unauthorized(detail: string, instance?: string) {
    return ProblemDetailsException.unauthorized(detail, instance);
  }

  static forbidden(detail: string, instance?: string) {
    return ProblemDetailsException.forbidden(detail, instance);
  }

  static conflict(resource: string, field: string, value: string, instance?: string) {
    return ProblemDetailsException.conflict(
      `${resource} with ${field} '${value}' already exists.`,
      instance,
    );
  }

  static validationError(
    errors: Record<string, string[]>,
    instance?: string,
  ) {
    return ProblemDetailsException.validationError(
      'One or more validation errors occurred.',
      errors,
      instance,
    );
  }

  static invalidInput(detail: string, instance?: string) {
    return ProblemDetailsException.badRequest(detail, instance);
  }

  static cannotFollowSelf(instance?: string) {
    return ProblemDetailsException.badRequest(
      'You cannot follow yourself.',
      instance,
    );
  }

  static alreadyFollowing(username: string, instance?: string) {
    return ProblemDetailsException.conflict(
      `You are already following '${username}'.`,
      instance,
    );
  }

  static notFollowing(username: string, instance?: string) {
    return ProblemDetailsException.badRequest(
      `You are not following '${username}'.`,
      instance,
    );
  }

  static alreadyLiked(targetType: string, instance?: string) {
    return ProblemDetailsException.conflict(
      `You have already liked this ${targetType}.`,
      instance,
    );
  }

  static notLiked(targetType: string, instance?: string) {
    return ProblemDetailsException.badRequest(
      `You have not liked this ${targetType}.`,
      instance,
    );
  }

  static tokenExpired(instance?: string) {
    return ProblemDetailsException.unauthorized(
      'Token has expired. Please refresh your authentication.',
      instance,
    );
  }

  static invalidCredentials(instance?: string) {
    return ProblemDetailsException.unauthorized(
      'Invalid email or password.',
      instance,
    );
  }

  static fromValidationErrors(
    validationErrors: { property: string; constraints: Record<string, string> }[],
    instance?: string,
  ): ProblemDetailsException {
    const errors: Record<string, string[]> = {};
    for (const error of validationErrors) {
      errors[error.property] = Object.values(error.constraints || {});
    }
    return this.validationError(errors, instance);
  }

  static fromHttpException(
    status: HttpStatus,
    message: string,
    instance?: string,
  ): ProblemDetailsPayload {
    const typeMap: Record<number, { type: string; title: string }> = {
      [HttpStatus.BAD_REQUEST]: {
        type: 'https://api.example.com/errors/bad-request',
        title: 'Bad Request',
      },
      [HttpStatus.UNAUTHORIZED]: {
        type: 'https://api.example.com/errors/unauthorized',
        title: 'Unauthorized',
      },
      [HttpStatus.FORBIDDEN]: {
        type: 'https://api.example.com/errors/forbidden',
        title: 'Forbidden',
      },
      [HttpStatus.NOT_FOUND]: {
        type: 'https://api.example.com/errors/not-found',
        title: 'Not Found',
      },
      [HttpStatus.CONFLICT]: {
        type: 'https://api.example.com/errors/conflict',
        title: 'Conflict',
      },
      [HttpStatus.UNPROCESSABLE_ENTITY]: {
        type: 'https://api.example.com/errors/validation-error',
        title: 'Validation Error',
      },
      [HttpStatus.INTERNAL_SERVER_ERROR]: {
        type: 'https://api.example.com/errors/internal-server-error',
        title: 'Internal Server Error',
      },
    };

    const { type, title } = typeMap[status] || {
      type: 'https://api.example.com/errors/unknown',
      title: 'Error',
    };

    return {
      type,
      title,
      status,
      detail: message,
      instance,
      timestamp: new Date().toISOString(),
    };
  }
}
