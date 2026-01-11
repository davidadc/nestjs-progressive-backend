import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ProblemDetails } from './problem-details';
import { ProblemDetailsException } from './problem-details.factory';
import {
  PaymentDomainException,
  PaymentNotFoundException,
  InvalidPaymentStateException,
  PaymentAlreadyProcessedException,
  PaymentProviderException,
  InvalidMoneyException,
  InvalidPaymentIdException,
  InvalidOrderIdException,
} from '../../payments/domain/exceptions';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = (request.headers['x-request-id'] as string) || randomUUID();
    const instance = `${request.method} ${request.path}`;

    let problemDetails: ProblemDetails;

    if (exception instanceof ProblemDetailsException) {
      // Already a problem details exception
      problemDetails = {
        ...exception.problemDetails,
        instance: exception.problemDetails.instance || instance,
        traceId,
      };
    } else if (exception instanceof PaymentDomainException) {
      // Map domain exceptions to problem details
      problemDetails = this.mapDomainException(exception, instance, traceId);
    } else if (exception instanceof HttpException) {
      // Map HTTP exceptions to problem details
      problemDetails = this.mapHttpException(exception, instance, traceId);
    } else {
      // Unknown error
      this.logger.error('Unhandled exception', exception);
      problemDetails = {
        type: 'https://api.payment.example.com/errors/internal-server-error',
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'An unexpected error occurred.',
        instance,
        timestamp: new Date().toISOString(),
        traceId,
      };
    }

    response
      .status(problemDetails.status)
      .header('Content-Type', 'application/problem+json')
      .json(problemDetails);
  }

  private mapDomainException(
    exception: PaymentDomainException,
    instance: string,
    traceId: string,
  ): ProblemDetails {
    const timestamp = new Date().toISOString();
    const baseUrl = 'https://api.payment.example.com/errors';

    if (exception instanceof PaymentNotFoundException) {
      return {
        type: `${baseUrl}/not-found`,
        title: 'Not Found',
        status: HttpStatus.NOT_FOUND,
        detail: exception.message,
        instance,
        timestamp,
        traceId,
      };
    }

    if (exception instanceof InvalidPaymentStateException) {
      return {
        type: `${baseUrl}/invalid-payment-state`,
        title: 'Invalid Payment State',
        status: HttpStatus.BAD_REQUEST,
        detail: exception.message,
        instance,
        timestamp,
        traceId,
      };
    }

    if (exception instanceof PaymentAlreadyProcessedException) {
      return {
        type: `${baseUrl}/payment-already-processed`,
        title: 'Payment Already Processed',
        status: HttpStatus.CONFLICT,
        detail: exception.message,
        instance,
        timestamp,
        traceId,
      };
    }

    if (exception instanceof PaymentProviderException) {
      return {
        type: `${baseUrl}/provider-error`,
        title: 'Payment Provider Error',
        status: HttpStatus.BAD_GATEWAY,
        detail: exception.message,
        instance,
        timestamp,
        traceId,
      };
    }

    if (exception instanceof InvalidMoneyException) {
      return {
        type: `${baseUrl}/invalid-input`,
        title: 'Invalid Input',
        status: HttpStatus.BAD_REQUEST,
        detail: exception.message,
        instance,
        timestamp,
        traceId,
      };
    }

    if (
      exception instanceof InvalidPaymentIdException ||
      exception instanceof InvalidOrderIdException
    ) {
      return {
        type: `${baseUrl}/invalid-input`,
        title: 'Invalid Input',
        status: HttpStatus.BAD_REQUEST,
        detail: exception.message,
        instance,
        timestamp,
        traceId,
      };
    }

    // Default domain exception handling
    return {
      type: `${baseUrl}/domain-error`,
      title: 'Domain Error',
      status: HttpStatus.BAD_REQUEST,
      detail: exception.message,
      instance,
      timestamp,
      traceId,
      extensions: {
        code: exception.code,
      },
    };
  }

  private mapHttpException(
    exception: HttpException,
    instance: string,
    traceId: string,
  ): ProblemDetails {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const timestamp = new Date().toISOString();
    const baseUrl = 'https://api.payment.example.com/errors';

    let detail: string;
    let extensions: Record<string, unknown> | undefined;

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      detail = (responseObj.message as string) || exception.message;

      // Handle validation errors from class-validator
      if (Array.isArray(responseObj.message)) {
        extensions = { errors: responseObj.message };
        detail = 'Validation failed';
      }
    } else {
      detail = exception.message;
    }

    const statusTitles: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Validation Failed',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    const statusTypes: Record<number, string> = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      409: 'conflict',
      422: 'validation-failed',
      500: 'internal-server-error',
      502: 'bad-gateway',
      503: 'service-unavailable',
    };

    return {
      type: `${baseUrl}/${statusTypes[status] || 'error'}`,
      title: statusTitles[status] || 'Error',
      status,
      detail,
      instance,
      timestamp,
      traceId,
      extensions,
    };
  }
}
