import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T): ApiResponse<T> => {
        // If response already has the expected format, return as-is
        if (data && typeof data === 'object' && 'success' in (data as object)) {
          return data as unknown as ApiResponse<T>;
        }

        const response = context.switchToHttp().getResponse<ExpressResponse>();
        return {
          success: true,
          statusCode: response.statusCode,
          data,
        };
      }),
    );
  }
}
