import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T | null
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T | null> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T | null) => {
        // Skip transformation if response is already sent (streams)
        if (response.headersSent) {
          return data;
        }

        // If data is null/undefined (e.g., 204 No Content), don't wrap
        if (data === undefined || data === null) {
          return null;
        }

        // If already wrapped (has success property), return as-is
        if (typeof data === 'object' && data !== null && 'success' in data) {
          return data;
        }

        const statusCode = response.statusCode || HttpStatus.OK;

        return {
          success: statusCode < 400,
          statusCode,
          data,
        };
      }),
    );
  }
}
