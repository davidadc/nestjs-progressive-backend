export const WEBHOOK_EVENT_REPOSITORY = Symbol('WEBHOOK_EVENT_REPOSITORY');

export type WebhookEventStatus = 'pending' | 'processed' | 'failed' | 'retrying' | 'dead_letter';

export interface WebhookEventData {
  id?: string;
  provider: 'stripe' | 'paystack';
  externalEventId: string;
  eventType: string;
  payload: string;
  signature: string | null;
  status: WebhookEventStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  lastError: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebhookEventRepository {
  /**
   * Save a webhook event
   */
  save(event: Partial<WebhookEventData>): Promise<WebhookEventData>;

  /**
   * Find by ID
   */
  findById(id: string): Promise<WebhookEventData | null>;

  /**
   * Find by external event ID and provider
   */
  findByExternalId(provider: string, externalEventId: string): Promise<WebhookEventData | null>;

  /**
   * Find events ready for retry
   */
  findEventsForRetry(limit?: number): Promise<WebhookEventData[]>;

  /**
   * Find failed events (dead letter queue)
   */
  findDeadLetterEvents(limit?: number): Promise<WebhookEventData[]>;

  /**
   * Update event status
   */
  updateStatus(
    id: string,
    status: WebhookEventStatus,
    error?: string,
  ): Promise<WebhookEventData | null>;

  /**
   * Mark event as processed
   */
  markAsProcessed(id: string): Promise<WebhookEventData | null>;

  /**
   * Schedule retry for an event
   */
  scheduleRetry(id: string, nextRetryAt: Date, error: string): Promise<WebhookEventData | null>;

  /**
   * Move event to dead letter queue
   */
  moveToDeadLetter(id: string, error: string): Promise<WebhookEventData | null>;
}
