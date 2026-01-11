import { HttpException, HttpStatus } from '@nestjs/common';

export interface ProblemDetailsPayload {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  timestamp?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export class ProblemDetailsException extends HttpException {
  constructor(payload: ProblemDetailsPayload) {
    super(
      {
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      },
      payload.status,
    );
  }

  static notFound(detail: string, instance?: string): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/not-found',
      title: 'Not Found',
      status: HttpStatus.NOT_FOUND,
      detail,
      instance,
    });
  }

  static unauthorized(
    detail: string,
    instance?: string,
  ): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/unauthorized',
      title: 'Unauthorized',
      status: HttpStatus.UNAUTHORIZED,
      detail,
      instance,
    });
  }

  static forbidden(detail: string, instance?: string): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/forbidden',
      title: 'Forbidden',
      status: HttpStatus.FORBIDDEN,
      detail,
      instance,
    });
  }

  static conflict(detail: string, instance?: string): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/conflict',
      title: 'Conflict',
      status: HttpStatus.CONFLICT,
      detail,
      instance,
    });
  }

  static validationError(
    detail: string,
    errors: Record<string, string[]>,
    instance?: string,
  ): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/validation-error',
      title: 'Validation Error',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      detail,
      instance,
      errors,
    });
  }

  static badRequest(
    detail: string,
    instance?: string,
  ): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/bad-request',
      title: 'Bad Request',
      status: HttpStatus.BAD_REQUEST,
      detail,
      instance,
    });
  }

  static internalError(
    detail: string,
    instance?: string,
  ): ProblemDetailsException {
    return new ProblemDetailsException({
      type: 'https://api.example.com/errors/internal-server-error',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail,
      instance,
    });
  }
}
