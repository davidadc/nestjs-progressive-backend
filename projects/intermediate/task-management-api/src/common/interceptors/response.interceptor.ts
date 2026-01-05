import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: ResponseEnvelope<T>['pagination'];
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T> | T> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: T) => {
        // Skip envelope for 204 No Content responses
        if (statusCode === 204) {
          return data;
        }

        // If response already has the envelope structure, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if data has pagination info
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'pagination' in data
        ) {
          const paginatedData = data as unknown as PaginatedResponse<unknown>;
          return {
            success: true,
            statusCode,
            data: paginatedData.items,
            pagination: paginatedData.pagination,
            meta: {
              timestamp: new Date().toISOString(),
              version: '1.0',
            },
          } as ResponseEnvelope<T>;
        }

        return {
          success: true,
          statusCode,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        };
      }),
    );
  }
}
