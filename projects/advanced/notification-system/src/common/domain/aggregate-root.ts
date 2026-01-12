import { AggregateRoot as CqrsAggregateRoot } from '@nestjs/cqrs';
import { DomainEvent } from './domain-event';

/**
 * Base class for Aggregate Roots.
 * Aggregates are consistency boundaries that encapsulate domain logic
 * and emit domain events.
 */
export abstract class AggregateRoot extends CqrsAggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this.apply(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public getUncommittedEvents(): DomainEvent[] {
    return this.getDomainEvents();
  }
}
