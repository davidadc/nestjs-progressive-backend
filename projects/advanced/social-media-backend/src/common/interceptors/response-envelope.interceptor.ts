import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // Check if data is already a paginated result
        if (this.isPaginatedResult(data)) {
          return {
            success: true,
            statusCode,
            data: data.items as T,
            pagination: data.pagination,
          };
        }

        return {
          success: true,
          statusCode,
          data,
        };
      }),
    );
  }

  private isPaginatedResult(data: unknown): data is PaginatedResult<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      'pagination' in data &&
      Array.isArray((data as PaginatedResult<unknown>).items)
    );
  }
}
