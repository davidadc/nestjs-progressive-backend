import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Inject,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import {
  IDEMPOTENCY_REPOSITORY,
  type IIdempotencyRepository,
} from './idempotency.repository';

export const IDEMPOTENT_KEY = 'idempotent';
export const Idempotent = (ttlMs: number = 24 * 60 * 60 * 1000) =>
  SetMetadata(IDEMPOTENT_KEY, { ttlMs });

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly IDEMPOTENCY_HEADER = 'idempotency-key';

  constructor(
    @Inject(IDEMPOTENCY_REPOSITORY)
    private readonly idempotencyRepository: IIdempotencyRepository,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const idempotentConfig = this.reflector.get<{ ttlMs: number }>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    if (!idempotentConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const idempotencyKey = request.headers[this.IDEMPOTENCY_HEADER] as string;
    if (!idempotencyKey) {
      return next.handle();
    }

    const requestHash = this.hashRequest(request);
    const existingKey =
      await this.idempotencyRepository.findByKey(idempotencyKey);

    if (existingKey) {
      // Check if request hash matches
      if (existingKey.requestHash !== requestHash) {
        throw new ConflictException(
          'Idempotency key was used with a different request payload',
        );
      }

      // Check if expired
      if (existingKey.expiresAt < new Date()) {
        await this.idempotencyRepository.deleteExpired();
        // Fall through to process as new request
      } else if (existingKey.status === 'completed' && existingKey.response) {
        // Return cached response
        response.setHeader('X-Idempotent-Replayed', 'true');
        if (existingKey.statusCode) {
          response.status(existingKey.statusCode);
        }
        return of(JSON.parse(existingKey.response));
      } else if (existingKey.status === 'processing') {
        throw new ConflictException(
          'A request with this idempotency key is already in progress',
        );
      }
    }

    // Create new idempotency record
    const expiresAt = new Date(Date.now() + idempotentConfig.ttlMs);
    const newKey = await this.idempotencyRepository.create({
      key: idempotencyKey,
      requestHash,
      status: 'processing',
      expiresAt,
    });

    return next.handle().pipe(
      tap((data) => {
        void this.idempotencyRepository.update(newKey.id, {
          status: 'completed',
          response: JSON.stringify(data),
          statusCode: response.statusCode,
        });
      }),
      catchError((error: Error) => {
        void this.idempotencyRepository.update(newKey.id, {
          status: 'failed',
        });
        throw error;
      }),
    );
  }

  private hashRequest(request: Request): string {
    const payload = JSON.stringify({
      method: request.method,
      path: request.path,
      body: request.body as unknown,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
