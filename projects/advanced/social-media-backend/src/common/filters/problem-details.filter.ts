import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ProblemDetailsException,
  ProblemDetailsPayload,
} from '../exceptions/problem-details.exception';
import { ProblemDetailsFactory } from '../exceptions/problem-details.factory';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const instance = `${request.method} ${request.url}`;
    const traceId = (request.headers['x-request-id'] as string) || this.generateTraceId();

    let problemDetails: ProblemDetailsPayload;

    if (exception instanceof ProblemDetailsException) {
      problemDetails = exception.getResponse() as ProblemDetailsPayload;
      problemDetails.instance = problemDetails.instance || instance;
      problemDetails.traceId = traceId;
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;

        // Handle class-validator errors
        if (Array.isArray(responseObj.message)) {
          const validationErrors = responseObj.message.map((msg: string) => ({
            property: 'field',
            constraints: { validation: msg },
          }));
          const validationException = ProblemDetailsFactory.fromValidationErrors(
            validationErrors,
            instance,
          );
          problemDetails = validationException.getResponse() as ProblemDetailsPayload;
          problemDetails.traceId = traceId;
          response.status(problemDetails.status).json(problemDetails);
          return;
        }
      } else {
        message = exception.message;
      }

      problemDetails = ProblemDetailsFactory.fromHttpException(status, message, instance);
      problemDetails.traceId = traceId;
    } else {
      this.logger.error('Unhandled exception', exception);

      problemDetails = {
        type: 'https://api.example.com/errors/internal-server-error',
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'An unexpected error occurred. Please try again later.',
        instance,
        timestamp: new Date().toISOString(),
        traceId,
      };
    }

    response.status(problemDetails.status).json(problemDetails);
  }

  private generateTraceId(): string {
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
