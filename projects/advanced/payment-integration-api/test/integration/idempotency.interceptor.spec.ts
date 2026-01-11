import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import * as crypto from 'crypto';
import { IdempotencyInterceptor } from '../../src/common/idempotency/idempotency.interceptor';
import {
  IDEMPOTENCY_REPOSITORY,
  IIdempotencyRepository,
} from '../../src/common/idempotency/idempotency.repository';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let mockRepository: jest.Mocked<IIdempotencyRepository>;
  let mockReflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (
    headers: Record<string, string> = {},
    body: Record<string, unknown> = {},
    method = 'POST',
    path = '/api/v1/payments',
  ): ExecutionContext => {
    const mockRequest = {
      method,
      path,
      body,
      headers,
    };
    const mockResponse = {
      statusCode: 200,
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (
    returnValue: unknown = { success: true },
  ): CallHandler => ({
    handle: () => of(returnValue),
  });

  beforeEach(async () => {
    mockRepository = {
      findByKey: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteExpired: jest.fn(),
    };

    mockReflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyInterceptor,
        {
          provide: IDEMPOTENCY_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);
  });

  describe('when endpoint is not decorated with @Idempotent', () => {
    it('should pass through without idempotency handling', async () => {
      mockReflector.get.mockReturnValue(undefined);
      const context = createMockExecutionContext();
      const handler = createMockCallHandler({ data: 'test' });

      const result$ = await interceptor.intercept(context, handler);
      const result = await new Promise((resolve) => result$.subscribe(resolve));

      expect(result).toEqual({ data: 'test' });
      expect(mockRepository.findByKey).not.toHaveBeenCalled();
    });
  });

  describe('when endpoint is decorated with @Idempotent', () => {
    beforeEach(() => {
      mockReflector.get.mockReturnValue({ ttlMs: 86400000 }); // 24 hours
    });

    describe('and no idempotency key is provided', () => {
      it('should process request normally without storing', async () => {
        const context = createMockExecutionContext({});
        const handler = createMockCallHandler({ id: '123' });

        const result$ = await interceptor.intercept(context, handler);
        const result = await new Promise((resolve) =>
          result$.subscribe(resolve),
        );

        expect(result).toEqual({ id: '123' });
        expect(mockRepository.findByKey).not.toHaveBeenCalled();
        expect(mockRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('and idempotency key is provided', () => {
      const idempotencyKey = 'unique-key-123';

      it('should process first request and store result', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-1', amount: 100 },
        );
        const responseData = { paymentId: 'pay-123', status: 'processing' };
        const handler = createMockCallHandler(responseData);

        mockRepository.findByKey.mockResolvedValue(null);
        mockRepository.create.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash: 'hash',
          status: 'processing',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        const result$ = await interceptor.intercept(context, handler);
        const result = await new Promise((resolve) =>
          result$.subscribe(resolve),
        );

        expect(result).toEqual(responseData);
        expect(mockRepository.findByKey).toHaveBeenCalledWith(idempotencyKey);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            key: idempotencyKey,
            status: 'processing',
          }),
        );
      });

      it('should return cached response for duplicate request', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-1', amount: 100 },
        );
        const cachedResponse = { paymentId: 'pay-123', status: 'completed' };
        const handler = createMockCallHandler();

        // Calculate the same hash the interceptor would generate
        const requestHash = crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              method: 'POST',
              path: '/api/v1/payments',
              body: { orderId: 'order-1', amount: 100 },
            }),
          )
          .digest('hex');

        mockRepository.findByKey.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash,
          status: 'completed',
          response: JSON.stringify(cachedResponse),
          statusCode: 201,
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        const result$ = await interceptor.intercept(context, handler);
        const result = await new Promise((resolve) =>
          result$.subscribe(resolve),
        );

        expect(result).toEqual(cachedResponse);
        expect(mockRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ConflictException for different payload with same key', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-2', amount: 200 }, // Different payload
        );
        const handler = createMockCallHandler();

        mockRepository.findByKey.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash: 'different-hash', // Hash doesn't match
          status: 'completed',
          response: '{}',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        await expect(interceptor.intercept(context, handler)).rejects.toThrow(
          ConflictException,
        );
        await expect(interceptor.intercept(context, handler)).rejects.toThrow(
          'Idempotency key was used with a different request payload',
        );
      });

      it('should throw ConflictException if request is already in progress', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-1', amount: 100 },
        );
        const handler = createMockCallHandler();

        const requestHash = crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              method: 'POST',
              path: '/api/v1/payments',
              body: { orderId: 'order-1', amount: 100 },
            }),
          )
          .digest('hex');

        mockRepository.findByKey.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash,
          status: 'processing', // Still processing
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        await expect(interceptor.intercept(context, handler)).rejects.toThrow(
          ConflictException,
        );
        await expect(interceptor.intercept(context, handler)).rejects.toThrow(
          'A request with this idempotency key is already in progress',
        );
      });

      it('should process new request if existing key has expired', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-1', amount: 100 },
        );
        const responseData = { paymentId: 'pay-new', status: 'processing' };
        const handler = createMockCallHandler(responseData);

        const requestHash = crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              method: 'POST',
              path: '/api/v1/payments',
              body: { orderId: 'order-1', amount: 100 },
            }),
          )
          .digest('hex');

        mockRepository.findByKey.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash,
          status: 'completed',
          response: '{"old": "response"}',
          expiresAt: new Date(Date.now() - 1000), // Expired
          createdAt: new Date(),
        });
        mockRepository.create.mockResolvedValue({
          id: 'idem-2',
          key: idempotencyKey,
          requestHash,
          status: 'processing',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        const result$ = await interceptor.intercept(context, handler);
        const result = await new Promise((resolve) =>
          result$.subscribe(resolve),
        );

        expect(result).toEqual(responseData);
        expect(mockRepository.deleteExpired).toHaveBeenCalled();
        expect(mockRepository.create).toHaveBeenCalled();
      });

      it('should mark key as failed when request throws error', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-1', amount: 100 },
        );
        const error = new Error('Payment failed');
        const handler: CallHandler = {
          handle: () => throwError(() => error),
        };

        mockRepository.findByKey.mockResolvedValue(null);
        mockRepository.create.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash: 'hash',
          status: 'processing',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        const result$ = await interceptor.intercept(context, handler);

        await expect(
          new Promise((resolve, reject) =>
            result$.subscribe({ next: resolve, error: reject }),
          ),
        ).rejects.toThrow('Payment failed');

        // Give time for the catchError to execute
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(mockRepository.update).toHaveBeenCalledWith('idem-1', {
          status: 'failed',
        });
      });

      it('should set X-Idempotent-Replayed header for cached responses', async () => {
        const context = createMockExecutionContext(
          { 'idempotency-key': idempotencyKey },
          { orderId: 'order-1', amount: 100 },
        );
        const mockResponse = context.switchToHttp().getResponse();
        const cachedResponse = { paymentId: 'pay-123' };
        const handler = createMockCallHandler();

        const requestHash = crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              method: 'POST',
              path: '/api/v1/payments',
              body: { orderId: 'order-1', amount: 100 },
            }),
          )
          .digest('hex');

        mockRepository.findByKey.mockResolvedValue({
          id: 'idem-1',
          key: idempotencyKey,
          requestHash,
          status: 'completed',
          response: JSON.stringify(cachedResponse),
          statusCode: 201,
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        });

        await interceptor.intercept(context, handler);

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'X-Idempotent-Replayed',
          'true',
        );
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe('request hashing', () => {
    beforeEach(() => {
      mockReflector.get.mockReturnValue({ ttlMs: 86400000 });
    });

    it('should generate different hashes for different request bodies', async () => {
      const hashes: string[] = [];

      for (const body of [{ amount: 100 }, { amount: 200 }]) {
        const context = createMockExecutionContext(
          { 'idempotency-key': `key-${body.amount}` },
          body,
        );
        const handler = createMockCallHandler();

        mockRepository.findByKey.mockResolvedValue(null);
        mockRepository.create.mockImplementation(async (data) => {
          hashes.push(data.requestHash);
          return { ...data, id: 'idem-1', createdAt: new Date() } as any;
        });

        const result$ = await interceptor.intercept(context, handler);
        await new Promise((resolve) => result$.subscribe(resolve));
      }

      expect(hashes[0]).not.toEqual(hashes[1]);
    });

    it('should generate same hash for identical requests', async () => {
      const hashes: string[] = [];
      const body = { orderId: 'order-1', amount: 100 };

      for (let i = 0; i < 2; i++) {
        const context = createMockExecutionContext(
          { 'idempotency-key': `key-${i}` },
          body,
        );
        const handler = createMockCallHandler();

        mockRepository.findByKey.mockResolvedValue(null);
        mockRepository.create.mockImplementation(async (data) => {
          hashes.push(data.requestHash);
          return { ...data, id: `idem-${i}`, createdAt: new Date() } as any;
        });

        const result$ = await interceptor.intercept(context, handler);
        await new Promise((resolve) => result$.subscribe(resolve));
      }

      expect(hashes[0]).toEqual(hashes[1]);
    });
  });
});
