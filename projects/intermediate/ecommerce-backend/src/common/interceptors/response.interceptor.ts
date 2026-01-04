import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
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

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Check if response has pagination info
        const hasPagination =
          data &&
          typeof data === 'object' &&
          ('page' in data || 'total' in data || 'pages' in data);

        if (hasPagination) {
          const { page, limit, total, pages, ...rest } = data as Record<
            string,
            unknown
          >;
          const mainData = Object.values(rest)[0] || rest;

          return {
            success: true as const,
            statusCode: response.statusCode,
            data: mainData as T,
            meta: {
              page: page as number,
              limit: limit as number,
              total: total as number,
              pages: pages as number,
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
