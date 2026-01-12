import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';

/**
 * Common module that provides shared utilities, guards, filters,
 * interceptors, and middleware used across the application.
 *
 * Components included:
 * - RequestIdMiddleware: Adds unique request ID for tracing
 * - Guards: JwtAuthGuard, WsJwtGuard
 * - Filters: ProblemDetailsFilter (RFC 7807)
 * - Interceptors: ResponseInterceptor
 * - Decorators: CurrentUser, Public
 */
@Module({
  providers: [],
  exports: [],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply RequestIdMiddleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
