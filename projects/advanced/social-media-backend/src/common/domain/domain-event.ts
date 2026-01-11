import { IEvent } from '@nestjs/cqrs';

export abstract class DomainEvent implements IEvent {
  readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }

  abstract get eventName(): string;
}
