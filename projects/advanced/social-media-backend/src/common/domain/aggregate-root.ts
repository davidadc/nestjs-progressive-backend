import { AggregateRoot as CqrsAggregateRoot } from '@nestjs/cqrs';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<T> extends CqrsAggregateRoot {
  protected readonly _id: T;

  constructor(id: T) {
    super();
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this.apply(event);
  }

  abstract toPrimitives(): Record<string, unknown>;
}
