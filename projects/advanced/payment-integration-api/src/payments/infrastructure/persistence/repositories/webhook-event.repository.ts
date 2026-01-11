import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { WebhookEventEntity } from '../entities/webhook-event.entity';
import type {
  IWebhookEventRepository,
  WebhookEventData,
  WebhookEventStatus,
} from '../../../domain/repositories/webhook-event.repository.interface';

@Injectable()
export class WebhookEventRepository implements IWebhookEventRepository {
  constructor(
    @InjectRepository(WebhookEventEntity)
    private readonly repository: Repository<WebhookEventEntity>,
  ) {}

  async save(event: Partial<WebhookEventData>): Promise<WebhookEventData> {
    const entity = this.repository.create(event);
    const saved = await this.repository.save(entity);
    return this.toData(saved);
  }

  async findById(id: string): Promise<WebhookEventData | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toData(entity) : null;
  }

  async findByExternalId(
    provider: string,
    externalEventId: string,
  ): Promise<WebhookEventData | null> {
    const entity = await this.repository.findOne({
      where: {
        provider: provider as 'stripe' | 'paystack',
        externalEventId,
      },
    });
    return entity ? this.toData(entity) : null;
  }

  async findEventsForRetry(limit: number = 100): Promise<WebhookEventData[]> {
    const now = new Date();
    const entities = await this.repository.find({
      where: {
        status: 'retrying',
        nextRetryAt: LessThanOrEqual(now),
      },
      order: { nextRetryAt: 'ASC' },
      take: limit,
    });
    return entities.map((e) => this.toData(e));
  }

  async findDeadLetterEvents(limit: number = 100): Promise<WebhookEventData[]> {
    const entities = await this.repository.find({
      where: { status: 'dead_letter' },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((e) => this.toData(e));
  }

  async updateStatus(
    id: string,
    status: WebhookEventStatus,
    error?: string,
  ): Promise<WebhookEventData | null> {
    const updateData: Partial<WebhookEventEntity> = { status };
    if (error) {
      updateData.lastError = error;
    }

    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async markAsProcessed(id: string): Promise<WebhookEventData | null> {
    await this.repository.update(id, {
      status: 'processed',
      processedAt: new Date(),
      nextRetryAt: null,
    });
    return this.findById(id);
  }

  async scheduleRetry(
    id: string,
    nextRetryAt: Date,
    error: string,
  ): Promise<WebhookEventData | null> {
    const event = await this.repository.findOne({ where: { id } });
    if (!event) return null;

    const newRetryCount = event.retryCount + 1;

    if (newRetryCount >= event.maxRetries) {
      return this.moveToDeadLetter(id, error);
    }

    await this.repository.update(id, {
      status: 'retrying',
      retryCount: newRetryCount,
      nextRetryAt,
      lastError: error,
    });

    return this.findById(id);
  }

  async moveToDeadLetter(id: string, error: string): Promise<WebhookEventData | null> {
    await this.repository.update(id, {
      status: 'dead_letter',
      lastError: error,
      nextRetryAt: null,
    });
    return this.findById(id);
  }

  private toData(entity: WebhookEventEntity): WebhookEventData {
    return {
      id: entity.id,
      provider: entity.provider,
      externalEventId: entity.externalEventId,
      eventType: entity.eventType,
      payload: entity.payload,
      signature: entity.signature,
      status: entity.status,
      retryCount: entity.retryCount,
      maxRetries: entity.maxRetries,
      nextRetryAt: entity.nextRetryAt,
      lastError: entity.lastError,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
