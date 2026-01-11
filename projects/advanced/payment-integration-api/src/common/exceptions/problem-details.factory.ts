import { HttpException, HttpStatus } from '@nestjs/common';
import { ProblemDetails } from './problem-details';

const BASE_TYPE_URL = 'https://api.payment.example.com/errors';

export class ProblemDetailsException extends HttpException {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails, problemDetails.status);
  }
}

export class ProblemDetailsFactory {
  /**
   * Generic not found error
   */
  static notFound(
    resource: string,
    identifier: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/not-found`,
      title: 'Not Found',
      status: HttpStatus.NOT_FOUND,
      detail: `${resource} with ID '${identifier}' not found.`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        resource,
        identifier,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Validation error
   */
  static validationError(
    errors: Array<{ field: string; constraints: Record<string, string> }>,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/validation-failed`,
      title: 'Validation Failed',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      detail: 'The request contains invalid data.',
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        errors,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Payment failed error
   */
  static paymentFailed(
    reason: string,
    declineCode?: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/payment-failed`,
      title: 'Payment Failed',
      status: HttpStatus.PAYMENT_REQUIRED,
      detail: reason,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        declineCode,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Payment already processed error
   */
  static paymentAlreadyProcessed(
    paymentId: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/payment-already-processed`,
      title: 'Payment Already Processed',
      status: HttpStatus.CONFLICT,
      detail: `Payment ${paymentId} has already been processed.`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        paymentId,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Invalid payment state error
   */
  static invalidPaymentState(
    currentState: string,
    attemptedAction: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/invalid-payment-state`,
      title: 'Invalid Payment State',
      status: HttpStatus.BAD_REQUEST,
      detail: `Cannot ${attemptedAction} payment in '${currentState}' state.`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        currentState,
        attemptedAction,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Unauthorized error
   */
  static unauthorized(
    reason: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/unauthorized`,
      title: 'Unauthorized',
      status: HttpStatus.UNAUTHORIZED,
      detail: reason,
      instance,
      timestamp: new Date().toISOString(),
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Forbidden error
   */
  static forbidden(reason: string, instance?: string): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/forbidden`,
      title: 'Forbidden',
      status: HttpStatus.FORBIDDEN,
      detail: reason,
      instance,
      timestamp: new Date().toISOString(),
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Invalid input error
   */
  static invalidInput(
    field: string,
    reason: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/invalid-input`,
      title: 'Invalid Input',
      status: HttpStatus.BAD_REQUEST,
      detail: `Field '${field}': ${reason}`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        field,
        reason,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Provider error
   */
  static providerError(
    provider: string,
    reason: string,
    instance?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/provider-error`,
      title: 'Payment Provider Error',
      status: HttpStatus.BAD_GATEWAY,
      detail: `Payment provider (${provider}) error: ${reason}`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        provider,
      },
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Internal server error
   */
  static internalError(
    instance?: string,
    traceId?: string,
  ): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/internal-server-error`,
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
      instance,
      timestamp: new Date().toISOString(),
      traceId,
    };
    return new ProblemDetailsException(problemDetails);
  }

  /**
   * Webhook signature invalid
   */
  static webhookSignatureInvalid(instance?: string): ProblemDetailsException {
    const problemDetails: ProblemDetails = {
      type: `${BASE_TYPE_URL}/webhook-signature-invalid`,
      title: 'Invalid Webhook Signature',
      status: HttpStatus.BAD_REQUEST,
      detail: 'The webhook signature is invalid or missing.',
      instance,
      timestamp: new Date().toISOString(),
    };
    return new ProblemDetailsException(problemDetails);
  }
}
