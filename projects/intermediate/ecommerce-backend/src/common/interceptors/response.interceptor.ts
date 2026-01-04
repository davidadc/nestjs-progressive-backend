import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

interface PaginatedData {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  [key: string]: unknown;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        // Check if response has pagination info
        // Must have 'page' property AND at least one of 'total' or 'pages'
        // to avoid false positives with data objects that have 'total' (like orders)
        const hasPagination =
          data &&
          typeof data === 'object' &&
          'page' in data &&
          ('total' in data || 'pages' in data);

        if (hasPagination) {
          const paginatedData = data as unknown as PaginatedData;
          const { page, limit, total, pages, ...rest } = paginatedData;
          const mainData = Object.values(rest)[0] || rest;

          return {
            success: true as const,
            statusCode: response.statusCode,
            data: mainData as T,
            meta: {
              page: page,
              limit: limit,
              total: total,
              pages: pages,
            },
          };
        }

        return {
          success: true as const,
          statusCode: response.statusCode,
          data,
        };
      }),
    );
  }
}
