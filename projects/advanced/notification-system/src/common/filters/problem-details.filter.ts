import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProblemDetails } from '../exceptions/problem-details.interface';
import { ProblemDetailsFactory } from '../exceptions/problem-details.factory';
import { NotificationDomainException } from '../../notifications/domain/exceptions/notification.exceptions';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = (request.headers['x-request-id'] as string) || this.generateTraceId();

    let problemDetails: ProblemDetails;

    if (exception instanceof HttpException) {
      problemDetails = this.handleHttpException(exception, request, traceId);
    } else if (exception instanceof NotificationDomainException) {
      problemDetails = this.handleDomainException(exception, request, traceId);
    } else {
      problemDetails = this.handleUnknownException(exception, traceId);
    }

    // Add instance (request path)
    problemDetails.instance = `${request.method} ${request.url}`;

    // Log the error
    if (problemDetails.status >= 500) {
      this.logger.error(
        `${problemDetails.status} ${problemDetails.title}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${problemDetails.status} ${problemDetails.title}: ${problemDetails.detail}`,
      );
    }

    response
      .status(problemDetails.status)
      .header('Content-Type', 'application/problem+json')
      .json(problemDetails);
  }

  private handleHttpException(
    exception: HttpException,
    request: Request,
    traceId: string,
  ): ProblemDetails {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Handle validation errors from class-validator
    if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
      const response = exceptionResponse as any;
      if (response.message && Array.isArray(response.message)) {
        const errors = response.message.map((msg: string) => ({
          field: this.extractFieldFromMessage(msg),
          message: msg,
        }));
        return ProblemDetailsFactory.validationError(errors, traceId);
      }
    }

    const detail =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : exception.message;

    return {
      type: `https://api.example.com/errors/${this.statusToType(status)}`,
      title: HttpStatus[status] || 'Error',
      status,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  private handleDomainException(
    exception: NotificationDomainException,
    request: Request,
    traceId: string,
  ): ProblemDetails {
    const statusMap: Record<string, number> = {
      NOTIFICATION_NOT_FOUND: 404,
      NOTIFICATION_ACCESS_DENIED: 403,
      INVALID_NOTIFICATION_ID: 400,
      INVALID_NOTIFICATION_TYPE: 400,
      INVALID_NOTIFICATION_CHANNEL: 400,
      NOTIFICATION_TITLE_TOO_LONG: 422,
      NOTIFICATION_MESSAGE_TOO_LONG: 422,
    };

    const status = statusMap[exception.code] || 400;

    return {
      type: `https://api.example.com/errors/${exception.code.toLowerCase().replace(/_/g, '-')}`,
      title: this.codeToTitle(exception.code),
      status,
      detail: exception.message,
      timestamp: new Date().toISOString(),
      traceId,
    };
  }

  private handleUnknownException(exception: unknown, traceId: string): ProblemDetails {
    this.logger.error('Unhandled exception', exception);
    return ProblemDetailsFactory.internalError(traceId);
  }

  private generateTraceId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private statusToType(status: number): string {
    const map: Record<number, string> = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      409: 'conflict',
      422: 'validation-failed',
      429: 'rate-limit-exceeded',
      500: 'internal-error',
    };
    return map[status] || 'error';
  }

  private codeToTitle(code: string): string {
    return code
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractFieldFromMessage(message: string): string {
    // Try to extract field name from validation message
    const match = message.match(/^(\w+)/);
    return match ? match[1] : 'unknown';
  }
}
