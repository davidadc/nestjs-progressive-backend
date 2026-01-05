import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  FileNotFoundException,
  FileAccessDeniedException,
  StorageQuotaExceededException,
  InvalidFileTypeException,
  FileTooLargeException,
  ThumbnailNotAvailableException,
  StorageException,
} from '../../files/domain/exceptions/file.exceptions';

interface ExceptionResponseObject {
  message?: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as ExceptionResponseObject;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      }
    } else if (exception instanceof FileNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      error = 'FileNotFoundException';
    } else if (exception instanceof FileAccessDeniedException) {
      status = HttpStatus.FORBIDDEN;
      message = exception.message;
      error = 'FileAccessDeniedException';
    } else if (exception instanceof StorageQuotaExceededException) {
      status = HttpStatus.INSUFFICIENT_STORAGE;
      message = exception.message;
      error = 'StorageQuotaExceededException';
    } else if (exception instanceof InvalidFileTypeException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'InvalidFileTypeException';
    } else if (exception instanceof FileTooLargeException) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = exception.message;
      error = 'FileTooLargeException';
    } else if (exception instanceof ThumbnailNotAvailableException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'ThumbnailNotAvailableException';
    } else if (exception instanceof StorageException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      error = 'StorageException';
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
