import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import {
  WEBHOOK_EVENT_REPOSITORY,
  type IWebhookEventRepository,
  type WebhookEventData,
} from '../../domain/repositories/webhook-event.repository.interface';
import { ProcessWebhookCommand } from '../commands';

export interface WebhookRetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  batchSize: number;
}

const DEFAULT_CONFIG: WebhookRetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 3600000, // 1 hour
  batchSize: 10,
};

@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);
  private readonly config: WebhookRetryConfig;

  constructor(
    @Inject(WEBHOOK_EVENT_REPOSITORY)
    private readonly webhookEventRepository: IWebhookEventRepository,
    private readonly commandBus: CommandBus,
  ) {
    this.config = DEFAULT_CONFIG;
  }

  /**
   * Store a webhook event for processing
   */
  async storeEvent(
    provider: 'stripe' | 'paystack',
    externalEventId: string,
    eventType: string,
    payload: string,
    signature: string | null,
  ): Promise<WebhookEventData> {
    // Check for duplicate event
    const existing = await this.webhookEventRepository.findByExternalId(
      provider,
      externalEventId,
    );
    if (existing) {
      this.logger.warn(
        `Duplicate webhook event: ${provider}/${externalEventId}`,
      );
      return existing;
    }

    return this.webhookEventRepository.save({
      provider,
      externalEventId,
      eventType,
      payload,
      signature,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      nextRetryAt: null,
      lastError: null,
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Process a webhook event and handle failures
   */
  async processEvent(event: WebhookEventData): Promise<boolean> {
    try {
      const command = new ProcessWebhookCommand(
        Buffer.from(event.payload),
        event.signature || '',
      );

      await this.commandBus.execute(command);
      await this.webhookEventRepository.markAsProcessed(event.id!);

      this.logger.log(`Webhook event processed: ${event.id}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process webhook event ${event.id}: ${errorMessage}`,
      );

      await this.scheduleRetry(event, errorMessage);
      return false;
    }
  }

  /**
   * Schedule a retry with exponential backoff
   */
  async scheduleRetry(event: WebhookEventData, error: string): Promise<void> {
    const nextRetryCount = event.retryCount + 1;

    if (nextRetryCount >= event.maxRetries) {
      this.logger.warn(
        `Moving event ${event.id} to dead letter queue after ${event.maxRetries} retries`,
      );
      await this.webhookEventRepository.moveToDeadLetter(event.id!, error);
      return;
    }

    const nextRetryAt = this.calculateNextRetryTime(nextRetryCount);
    await this.webhookEventRepository.scheduleRetry(
      event.id!,
      nextRetryAt,
      error,
    );

    this.logger.log(
      `Scheduled retry ${nextRetryCount}/${event.maxRetries} for event ${event.id} at ${nextRetryAt.toISOString()}`,
    );
  }

  /**
   * Calculate next retry time using exponential backoff with jitter
   */
  calculateNextRetryTime(retryCount: number): Date {
    // Exponential backoff: baseDelay * 2^retryCount
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, retryCount);

    // Add jitter (±10% randomization)
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);

    // Cap at max delay
    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelayMs);

    return new Date(Date.now() + delay);
  }

  /**
   * Process pending retry events (scheduled job)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processRetryQueue(): Promise<void> {
    const events = await this.webhookEventRepository.findEventsForRetry(
      this.config.batchSize,
    );

    if (events.length === 0) {
      return;
    }

    this.logger.log(
      `Processing ${events.length} webhook events from retry queue`,
    );

    for (const event of events) {
      try {
        await this.processEvent(event);
      } catch (error) {
        this.logger.error(
          `Error processing retry event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  /**
   * Get dead letter queue events
   */
  async getDeadLetterEvents(limit: number = 100): Promise<WebhookEventData[]> {
    return this.webhookEventRepository.findDeadLetterEvents(limit);
  }

  /**
   * Manually retry a dead letter event
   */
  async retryDeadLetterEvent(eventId: string): Promise<boolean> {
    const event = await this.webhookEventRepository.findById(eventId);
    if (!event || event.status !== 'dead_letter') {
      return false;
    }

    // Reset retry count and status
    await this.webhookEventRepository.save({
      ...event,
      status: 'pending',
      retryCount: 0,
      lastError: null,
    });

    return this.processEvent(event);
  }
}
