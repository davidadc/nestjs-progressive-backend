import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
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
    pages: number;
  };
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // If response already has pagination, extract it
        if (data && typeof data === 'object' && 'pagination' in data) {
          const { pagination, data: responseData, ...rest } = data;
          return {
            success: true,
            statusCode,
            data: responseData || rest,
            pagination,
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
}
