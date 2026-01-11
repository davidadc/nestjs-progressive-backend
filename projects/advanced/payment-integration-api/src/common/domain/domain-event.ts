import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly eventType: string;

  constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.eventType = this.constructor.name;
  }

  abstract getAggregateId(): string;
}
