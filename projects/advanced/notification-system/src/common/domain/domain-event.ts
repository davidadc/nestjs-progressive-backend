import { IEvent } from '@nestjs/cqrs';

/**
 * Base class for Domain Events.
 * Domain Events represent something that happened in the domain.
 */
export abstract class DomainEvent implements IEvent {
  public readonly occurredOn: Date;

  protected constructor() {
    this.occurredOn = new Date();
  }
}
