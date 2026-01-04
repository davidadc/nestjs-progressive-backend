import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
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

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // If response already has the envelope structure, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if data has pagination info
        if (data && typeof data === 'object' && 'items' in data && 'pagination' in data) {
          return {
            success: true,
            statusCode,
            data: data.items,
            pagination: data.pagination,
            meta: {
              timestamp: new Date().toISOString(),
              version: '1.0',
            },
          };
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
