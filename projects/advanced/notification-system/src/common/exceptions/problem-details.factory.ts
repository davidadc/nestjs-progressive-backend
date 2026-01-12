import { ProblemDetails } from './problem-details.interface';

export class ProblemDetailsFactory {
  private static readonly BASE_URL = 'https://api.example.com/errors';

  static notFound(resource: string, id: string, traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/not-found`,
      title: 'Not Found',
      status: 404,
      detail: `${resource} with ID '${id}' not found.`,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  static forbidden(reason: string, traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/forbidden`,
      title: 'Forbidden',
      status: 403,
      detail: reason,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  static unauthorized(reason: string = 'Authentication required', traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/unauthorized`,
      title: 'Unauthorized',
      status: 401,
      detail: reason,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  static badRequest(detail: string, traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/bad-request`,
      title: 'Bad Request',
      status: 400,
      detail,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  static validationError(
    errors: Array<{ field: string; message: string }>,
    traceId?: string,
  ): ProblemDetails {
    return {
      type: `${this.BASE_URL}/validation-failed`,
      title: 'Validation Failed',
      status: 422,
      detail: 'The request contains invalid data.',
      timestamp: new Date().toISOString(),
      traceId,
      extensions: { errors },
    };
  }

  static internalError(traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/internal-error`,
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred. Please try again later.',
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  static conflict(detail: string, traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/conflict`,
      title: 'Conflict',
      status: 409,
      detail,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  static tooManyRequests(retryAfter: number, traceId?: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/rate-limit-exceeded`,
      title: 'Too Many Requests',
      status: 429,
      detail: `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
      timestamp: new Date().toISOString(),
      traceId,
      extensions: { retryAfter },
    };
  }
}
