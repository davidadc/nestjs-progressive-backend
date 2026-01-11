import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { WebhookRetryService } from '../../src/payments/application/services/webhook-retry.service';
import {
  WEBHOOK_EVENT_REPOSITORY,
  type WebhookEventData,
} from '../../src/payments/domain/repositories/webhook-event.repository.interface';

describe('WebhookRetryService (Integration)', () => {
  let webhookRetryService: WebhookRetryService;
  let mockWebhookEventRepository: jest.Mocked<any>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  const mockEvent: WebhookEventData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    provider: 'stripe',
    externalEventId: 'evt_test_123',
    eventType: 'checkout.session.completed',
    payload: JSON.stringify({ type: 'checkout.session.completed', data: {} }),
    signature: 'valid_sig',
    status: 'pending',
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: null,
    lastError: null,
    processedAt: null,
    createdAt: new Date('2026-01-11'),
    updatedAt: new Date('2026-01-11'),
  };

  beforeEach(async () => {
    mockWebhookEventRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByExternalId: jest.fn(),
      findEventsForRetry: jest.fn(),
      findDeadLetterEvents: jest.fn(),
      updateStatus: jest.fn(),
      markAsProcessed: jest.fn(),
      scheduleRetry: jest.fn(),
      moveToDeadLetter: jest.fn(),
    };

    mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookRetryService,
        {
          provide: WEBHOOK_EVENT_REPOSITORY,
          useValue: mockWebhookEventRepository,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    webhookRetryService = module.get<WebhookRetryService>(WebhookRetryService);
  });

  describe('storeEvent', () => {
    it('should store a new webhook event', async () => {
      mockWebhookEventRepository.findByExternalId.mockResolvedValue(null);
      mockWebhookEventRepository.save.mockResolvedValue(mockEvent);

      const result = await webhookRetryService.storeEvent(
        'stripe',
        'evt_test_123',
        'checkout.session.completed',
        JSON.stringify({ type: 'checkout.session.completed' }),
        'valid_sig',
      );

      expect(result).toEqual(mockEvent);
      expect(mockWebhookEventRepository.save).toHaveBeenCalled();
    });

    it('should return existing event for duplicate', async () => {
      mockWebhookEventRepository.findByExternalId.mockResolvedValue(mockEvent);

      const result = await webhookRetryService.storeEvent(
        'stripe',
        'evt_test_123',
        'checkout.session.completed',
        JSON.stringify({ type: 'checkout.session.completed' }),
        'valid_sig',
      );

      expect(result).toEqual(mockEvent);
      expect(mockWebhookEventRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('processEvent', () => {
    it('should mark event as processed on success', async () => {
      mockCommandBus.execute.mockResolvedValue({ received: true });
      mockWebhookEventRepository.markAsProcessed.mockResolvedValue({
        ...mockEvent,
        status: 'processed',
      });

      const result = await webhookRetryService.processEvent(mockEvent);

      expect(result).toBe(true);
      expect(mockWebhookEventRepository.markAsProcessed).toHaveBeenCalledWith(
        mockEvent.id,
      );
    });

    it('should schedule retry on failure', async () => {
      const error = new Error('Processing failed');
      mockCommandBus.execute.mockRejectedValue(error);
      mockWebhookEventRepository.scheduleRetry.mockResolvedValue({
        ...mockEvent,
        status: 'retrying',
        retryCount: 1,
      });

      const result = await webhookRetryService.processEvent(mockEvent);

      expect(result).toBe(false);
      expect(mockWebhookEventRepository.scheduleRetry).toHaveBeenCalled();
    });
  });

  describe('scheduleRetry', () => {
    it('should schedule retry with exponential backoff', async () => {
      mockWebhookEventRepository.scheduleRetry.mockResolvedValue({
        ...mockEvent,
        status: 'retrying',
        retryCount: 1,
      });

      await webhookRetryService.scheduleRetry(mockEvent, 'Test error');

      expect(mockWebhookEventRepository.scheduleRetry).toHaveBeenCalledWith(
        mockEvent.id,
        expect.any(Date),
        'Test error',
      );
    });

    it('should move to dead letter queue after max retries', async () => {
      const maxRetriedEvent = { ...mockEvent, retryCount: 4, maxRetries: 5 };
      mockWebhookEventRepository.moveToDeadLetter.mockResolvedValue({
        ...maxRetriedEvent,
        status: 'dead_letter',
      });

      await webhookRetryService.scheduleRetry(maxRetriedEvent, 'Final error');

      expect(mockWebhookEventRepository.moveToDeadLetter).toHaveBeenCalledWith(
        maxRetriedEvent.id,
        'Final error',
      );
    });
  });

  describe('calculateNextRetryTime', () => {
    it('should calculate exponential backoff delay', () => {
      const retry1 = webhookRetryService.calculateNextRetryTime(1);
      const retry2 = webhookRetryService.calculateNextRetryTime(2);
      const retry3 = webhookRetryService.calculateNextRetryTime(3);

      // Retry 1 should be ~2 seconds
      expect(retry1.getTime() - Date.now()).toBeGreaterThan(1500);
      expect(retry1.getTime() - Date.now()).toBeLessThan(2500);

      // Retry 2 should be ~4 seconds
      expect(retry2.getTime() - Date.now()).toBeGreaterThan(3500);
      expect(retry2.getTime() - Date.now()).toBeLessThan(4500);

      // Retry 3 should be ~8 seconds
      expect(retry3.getTime() - Date.now()).toBeGreaterThan(7000);
      expect(retry3.getTime() - Date.now()).toBeLessThan(9000);
    });

    it('should cap delay at max delay', () => {
      const retry10 = webhookRetryService.calculateNextRetryTime(20);

      // Should be capped at 1 hour (3600000 ms)
      expect(retry10.getTime() - Date.now()).toBeLessThanOrEqual(3600000 * 1.1);
    });
  });

  describe('processRetryQueue', () => {
    it('should process events from retry queue', async () => {
      const retryingEvent = { ...mockEvent, status: 'retrying' as const };
      mockWebhookEventRepository.findEventsForRetry.mockResolvedValue([
        retryingEvent,
      ]);
      mockCommandBus.execute.mockResolvedValue({ received: true });
      mockWebhookEventRepository.markAsProcessed.mockResolvedValue({
        ...retryingEvent,
        status: 'processed',
      });

      await webhookRetryService.processRetryQueue();

      expect(mockWebhookEventRepository.findEventsForRetry).toHaveBeenCalled();
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should do nothing when queue is empty', async () => {
      mockWebhookEventRepository.findEventsForRetry.mockResolvedValue([]);

      await webhookRetryService.processRetryQueue();

      expect(mockWebhookEventRepository.findEventsForRetry).toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('getDeadLetterEvents', () => {
    it('should return dead letter events', async () => {
      const deadLetterEvent = { ...mockEvent, status: 'dead_letter' as const };
      mockWebhookEventRepository.findDeadLetterEvents.mockResolvedValue([
        deadLetterEvent,
      ]);

      const result = await webhookRetryService.getDeadLetterEvents();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('dead_letter');
    });
  });

  describe('retryDeadLetterEvent', () => {
    it('should retry a dead letter event', async () => {
      const deadLetterEvent = { ...mockEvent, status: 'dead_letter' as const };
      mockWebhookEventRepository.findById.mockResolvedValue(deadLetterEvent);
      mockWebhookEventRepository.save.mockResolvedValue({
        ...deadLetterEvent,
        status: 'pending',
      });
      mockCommandBus.execute.mockResolvedValue({ received: true });
      mockWebhookEventRepository.markAsProcessed.mockResolvedValue({
        ...deadLetterEvent,
        status: 'processed',
      });

      const result = await webhookRetryService.retryDeadLetterEvent(
        deadLetterEvent.id!,
      );

      expect(result).toBe(true);
    });

    it('should return false for non-existent event', async () => {
      mockWebhookEventRepository.findById.mockResolvedValue(null);

      const result =
        await webhookRetryService.retryDeadLetterEvent('non-existent-id');

      expect(result).toBe(false);
    });

    it('should return false for non-dead-letter event', async () => {
      mockWebhookEventRepository.findById.mockResolvedValue(mockEvent);

      const result = await webhookRetryService.retryDeadLetterEvent(
        mockEvent.id!,
      );

      expect(result).toBe(false);
    });
  });
});
