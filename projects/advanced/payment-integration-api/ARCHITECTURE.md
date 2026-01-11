# ARCHITECTURE.md - Project Architecture Guide

---

## Project Architecture Overview

**Project:** Payment Integration API
**Level:** Advanced
**Architecture Style:** Modular DDD + CQRS

---

## Layer Structure

### Advanced: 5-Layer DDD + CQRS

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Guards)           │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Commands, Queries, Event Handlers,    │
│   DTOs, Mappers, Application Services)  │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Aggregates, Value Objects, Domain     │
│   Events, Repository Interfaces)        │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, External Services,      │
│   Event Publishers, ORM Entities)       │
├─────────────────────────────────────────┤
│           Shared/Common Layer           │
│  (Base Classes, Utilities, Exceptions)  │
└─────────────────────────────────────────┘
```

**Request Flow (Command - Write Operation):**
```
HTTP Request → Controller → CommandBus → CommandHandler → Aggregate → Repository → Database
                                              ↓
                                        Domain Event → EventBus → Event Handlers
```

**Request Flow (Query - Read Operation):**
```
HTTP Request → Controller → QueryBus → QueryHandler → Repository → Database
```

---

## Folder Structure

### Advanced Level Structure

```
src/
├── payments/                        # Feature module
│   ├── payments.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── payment.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── payment-id.vo.ts
│   │   │   ├── money.vo.ts
│   │   │   └── payment-status.vo.ts
│   │   ├── events/
│   │   │   ├── payment-created.event.ts
│   │   │   ├── payment-processed.event.ts
│   │   │   ├── payment-completed.event.ts
│   │   │   └── payment-failed.event.ts
│   │   ├── repositories/
│   │   │   └── payment.repository.interface.ts
│   │   └── exceptions/
│   │       └── payment.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── initiate-payment.command.ts
│   │   │   ├── initiate-payment.handler.ts
│   │   │   ├── process-webhook.command.ts
│   │   │   ├── process-webhook.handler.ts
│   │   │   ├── refund-payment.command.ts
│   │   │   └── refund-payment.handler.ts
│   │   ├── queries/
│   │   │   ├── get-payment-status.query.ts
│   │   │   ├── get-payment-status.handler.ts
│   │   │   ├── list-transactions.query.ts
│   │   │   └── list-transactions.handler.ts
│   │   ├── dto/
│   │   │   ├── initiate-payment.dto.ts
│   │   │   ├── payment-response.dto.ts
│   │   │   └── transaction-response.dto.ts
│   │   ├── mappers/
│   │   │   ├── payment.mapper.ts
│   │   │   └── transaction.mapper.ts
│   │   ├── event-handlers/
│   │   │   ├── payment-completed.handler.ts
│   │   │   └── payment-failed.handler.ts
│   │   └── strategies/
│   │       ├── payment.strategy.interface.ts
│   │       └── stripe.strategy.ts
│   └── infrastructure/
│       ├── controllers/
│       │   ├── payment.controller.ts
│       │   └── webhook.controller.ts
│       ├── persistence/
│       │   ├── entities/
│       │   │   ├── payment.entity.ts
│       │   │   └── transaction.entity.ts
│       │   └── repositories/
│       │       ├── payment.repository.ts
│       │       └── transaction.repository.ts
│       └── external/
│           └── stripe.client.ts
├── common/
│   ├── domain/                      # Base DDD classes
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   │   └── webhook-signature.guard.ts
│   ├── interceptors/
│   └── exceptions/
│       ├── problem-details.ts
│       ├── problem-details.factory.ts
│       └── problem-details.filter.ts
├── config/
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Advanced Level Patterns (Must Implement)

- [x] **Repository Pattern** - Abstract data access behind interfaces
- [x] **Factory Pattern** - Centralize Aggregate and Value Object creation
- [x] **Strategy Pattern** - Interchangeable payment providers (Stripe/Paystack)
- [x] **Observer Pattern** - Domain Events for side effects
- [x] **Mediator Pattern** - CommandBus/QueryBus for CQRS
- [x] **State Pattern** - Payment status transitions
- [x] **Domain Events** - Decouple domain changes from side effects

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, format responses

**Contains:**
- Controllers (route handling)
- Pipes (validation, transformation)
- Guards (authentication, webhook signature)
- Interceptors (logging, response formatting)

**Rules:**
- NO business logic
- NO direct database access
- Validate all input
- Use CommandBus/QueryBus for operations

### Application Layer

**Purpose:** Orchestrate use cases, coordinate domain objects

**Contains:**
- Commands + Handlers (write operations)
- Queries + Handlers (read operations)
- DTOs (data transfer)
- Mappers (entity <-> DTO conversion)
- Event Handlers (react to domain events)
- Payment Strategies (provider implementations)

**Rules:**
- NO HTTP/infrastructure concerns
- Coordinate domain objects
- Publish domain events
- Handle transactions

### Domain Layer

**Purpose:** Core business logic, domain rules, invariants

**Contains:**
- Aggregates (Payment - consistency boundary)
- Value Objects (Money, PaymentId, PaymentStatus)
- Domain Events (PaymentCreated, PaymentCompleted, etc.)
- Repository Interfaces (data access contracts)
- Domain Exceptions (business rule violations)

**Rules:**
- NO framework dependencies
- NO infrastructure concerns
- Enforce business invariants
- Rich domain model (behavior + data)

### Infrastructure Layer

**Purpose:** Technical implementations, external services

**Contains:**
- Repository Implementations (TypeORM)
- ORM Entities (database mappings)
- External Service Clients (Stripe SDK)
- Configuration

**Rules:**
- Implement domain interfaces
- Handle technical concerns
- NO business logic

---

## CQRS Implementation

### Commands (Write Operations)

```typescript
// Command definition
export class InitiatePaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {}
}

// Command handler
@CommandHandler(InitiatePaymentCommand)
export class InitiatePaymentHandler implements ICommandHandler<InitiatePaymentCommand> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_STRATEGY)
    private readonly paymentStrategy: IPaymentStrategy,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: InitiatePaymentCommand): Promise<PaymentResponseDto> {
    // 1. Create aggregate
    const payment = Payment.create({
      orderId: OrderId.create(command.orderId),
      amount: Money.create(command.amount, command.currency),
    });

    // 2. Process with external provider
    const result = await this.paymentStrategy.createPaymentIntent(payment.amount);
    payment.process(result.externalId);

    // 3. Persist
    await this.paymentRepository.save(payment);

    // 4. Publish domain events
    this.eventBus.publishAll(payment.getUncommittedEvents());

    // 5. Return DTO
    return PaymentMapper.toDto(payment);
  }
}
```

### Queries (Read Operations)

```typescript
// Query definition
export class GetPaymentStatusQuery {
  constructor(public readonly orderId: string) {}
}

// Query handler
@QueryHandler(GetPaymentStatusQuery)
export class GetPaymentStatusHandler implements IQueryHandler<GetPaymentStatusQuery> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentStatusQuery): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findByOrderId(query.orderId);
    if (!payment) {
      throw ProblemDetailsFactory.notFound('Payment', query.orderId);
    }
    return PaymentMapper.toDto(payment);
  }
}
```

---

## Domain Event Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Aggregate  │────>│  Event Bus  │────>│   Handler   │
│  (creates)  │     │  (routes)   │     │  (reacts)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                              ┌─────────────────┐
       │                              │ Side Effects:   │
       │                              │ - Update Order  │
       │                              │ - Notifications │
       │                              │ - Analytics     │
       └──────────────────────────────│ - Audit Log     │
                                      └─────────────────┘
```

### Domain Event Example

```typescript
// Event definition
export class PaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly occurredAt: Date = new Date(),
  ) {
    super();
  }
}

// Event handler
@EventsHandler(PaymentCompletedEvent)
export class PaymentCompletedHandler implements IEventHandler<PaymentCompletedEvent> {
  constructor(
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
  ) {}

  async handle(event: PaymentCompletedEvent): Promise<void> {
    // Update order status
    await this.orderService.markAsPaid(event.orderId);

    // Send confirmation
    await this.notificationService.sendPaymentConfirmation(event);
  }
}
```

---

## Value Objects

### Implementation Pattern

```typescript
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

// Money Value Object
export class Money extends ValueObject<{ amount: number; currency: string }> {
  private constructor(props: { amount: number; currency: string }) {
    super(props);
  }

  public static create(amount: number, currency: string = 'USD'): Money {
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative');
    }
    if (!['USD', 'EUR', 'GBP', 'NGN'].includes(currency)) {
      throw new InvalidCurrencyException(currency);
    }
    return new Money({ amount: Math.round(amount * 100) / 100, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException();
    }
    return Money.create(this.amount + other.amount, this.currency);
  }
}
```

---

## Aggregate Root

### Implementation Pattern

```typescript
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}

// Payment Aggregate
export class Payment extends AggregateRoot {
  private _id: PaymentId;
  private _orderId: OrderId;
  private _amount: Money;
  private _status: PaymentStatus;
  private _provider: string;
  private _externalId?: string;

  private constructor() {
    super();
  }

  public static create(props: CreatePaymentProps): Payment {
    const payment = new Payment();
    payment._id = PaymentId.generate();
    payment._orderId = props.orderId;
    payment._amount = props.amount;
    payment._status = PaymentStatus.Pending;
    payment._provider = 'stripe';

    payment.addDomainEvent(new PaymentCreatedEvent(
      payment._id.value,
      payment._orderId.value,
      payment._amount.amount,
      payment._amount.currency,
    ));

    return payment;
  }

  public process(externalId: string): void {
    if (!this._status.canTransitionTo(PaymentStatus.Processing)) {
      throw new InvalidPaymentStateException(this._status.value, 'processing');
    }
    this._externalId = externalId;
    this._status = PaymentStatus.Processing;

    this.addDomainEvent(new PaymentProcessedEvent(
      this._id.value,
      this._orderId.value,
      externalId,
    ));
  }

  public complete(): void {
    if (!this._status.canTransitionTo(PaymentStatus.Completed)) {
      throw new InvalidPaymentStateException(this._status.value, 'completed');
    }
    this._status = PaymentStatus.Completed;

    this.addDomainEvent(new PaymentCompletedEvent(
      this._id.value,
      this._orderId.value,
      this._amount.amount,
      this._amount.currency,
    ));
  }

  public fail(reason: string): void {
    this._status = PaymentStatus.Failed;

    this.addDomainEvent(new PaymentFailedEvent(
      this._id.value,
      this._orderId.value,
      reason,
    ));
  }

  // Getters
  get id(): PaymentId { return this._id; }
  get orderId(): OrderId { return this._orderId; }
  get amount(): Money { return this._amount; }
  get status(): PaymentStatus { return this._status; }
}
```

---

## Mapper Pattern

```typescript
export class PaymentMapper {
  // Domain → DTO
  public static toDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id.value,
      orderId: payment.orderId.value,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status.value,
      provider: payment.provider,
      createdAt: payment.createdAt,
    };
  }

  // ORM Entity → Domain
  public static toDomain(entity: PaymentEntity): Payment {
    return Payment.reconstitute({
      id: PaymentId.create(entity.id),
      orderId: OrderId.create(entity.orderId),
      amount: Money.create(entity.amount, entity.currency),
      status: PaymentStatus.fromString(entity.status),
      provider: entity.provider,
      externalId: entity.externalId,
      createdAt: entity.createdAt,
    });
  }

  // Domain → ORM Entity
  public static toPersistence(payment: Payment): Partial<PaymentEntity> {
    return {
      id: payment.id.value,
      orderId: payment.orderId.value,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status.value,
      provider: payment.provider,
      externalId: payment.externalId,
    };
  }
}
```

---

## Error Handling (RFC 7807)

### Problem Details Implementation

```typescript
// Factory usage
throw ProblemDetailsFactory.notFound('Payment', paymentId);
throw ProblemDetailsFactory.paymentFailed('Card declined', 'insufficient_funds');
throw ProblemDetailsFactory.forbidden('Cannot refund completed payment');
throw ProblemDetailsFactory.validationError(validationErrors);

// Response format
{
  "type": "https://api.example.com/errors/payment-failed",
  "title": "Payment Failed",
  "status": 402,
  "detail": "Payment was declined: insufficient_funds",
  "instance": "POST /api/v1/orders/abc-123/checkout",
  "timestamp": "2026-01-11T12:00:00Z",
  "traceId": "req-xyz-789",
  "extensions": {
    "orderId": "abc-123",
    "declineCode": "insufficient_funds"
  }
}
```

---

## Payment Strategy Pattern

```typescript
// Strategy interface
export interface IPaymentStrategy {
  createPaymentIntent(amount: Money): Promise<PaymentIntentResult>;
  confirmPayment(externalId: string): Promise<PaymentStatus>;
  refund(externalId: string, amount?: Money): Promise<RefundResult>;
}

// Stripe implementation
@Injectable()
export class StripePaymentStrategy implements IPaymentStrategy {
  constructor(private readonly stripeClient: Stripe) {}

  async createPaymentIntent(amount: Money): Promise<PaymentIntentResult> {
    const intent = await this.stripeClient.paymentIntents.create({
      amount: Math.round(amount.amount * 100),
      currency: amount.currency.toLowerCase(),
    });

    return {
      externalId: intent.id,
      clientSecret: intent.client_secret,
      status: 'processing',
    };
  }

  async confirmPayment(externalId: string): Promise<PaymentStatus> {
    const intent = await this.stripeClient.paymentIntents.retrieve(externalId);
    return intent.status === 'succeeded'
      ? PaymentStatus.Completed
      : PaymentStatus.Failed;
  }

  async refund(externalId: string, amount?: Money): Promise<RefundResult> {
    const refund = await this.stripeClient.refunds.create({
      payment_intent: externalId,
      amount: amount ? Math.round(amount.amount * 100) : undefined,
    });

    return {
      refundId: refund.id,
      status: refund.status,
    };
  }
}
```

---

## Module Wiring

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PaymentEntity, TransactionEntity]),
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    // Repository
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
    // Payment Strategy
    {
      provide: PAYMENT_STRATEGY,
      useClass: StripePaymentStrategy,
    },
    // Command Handlers
    InitiatePaymentHandler,
    ProcessWebhookHandler,
    RefundPaymentHandler,
    // Query Handlers
    GetPaymentStatusHandler,
    ListTransactionsHandler,
    // Event Handlers
    PaymentCompletedHandler,
    PaymentFailedHandler,
    // External Services
    StripeClient,
  ],
  exports: [PAYMENT_REPOSITORY],
})
export class PaymentsModule {}
```

---

## Architecture Checklist

### Advanced Level Requirements

#### Domain Layer
- [ ] Aggregate roots implemented (Payment)
- [ ] Value objects for domain concepts (Money, PaymentId, PaymentStatus)
- [ ] Domain events defined (Created, Processed, Completed, Failed)
- [ ] Repository interfaces defined
- [ ] Domain exceptions created

#### Application Layer
- [ ] Commands for write operations (Initiate, ProcessWebhook, Refund)
- [ ] Queries for read operations (GetStatus, ListTransactions)
- [ ] Event handlers for side effects
- [ ] Mappers for all conversions
- [ ] Payment strategies for providers

#### Infrastructure Layer
- [ ] Repository implementations (TypeORM)
- [ ] Controllers with proper routing
- [ ] Webhook signature validation
- [ ] External service clients (Stripe)
- [ ] ORM entities separate from domain

#### Cross-Cutting
- [ ] Authentication (JWT)
- [ ] Authorization (user/admin roles)
- [ ] Validation (DTOs)
- [ ] Error handling (RFC 7807)
- [ ] Response formatting
- [ ] Logging

#### Testing
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| HTTP handling | `infrastructure/controllers/` |
| Business logic | `domain/aggregates/` |
| State transitions | `domain/aggregates/` + `domain/value-objects/` |
| Data contracts | `application/dto/` |
| Data access | `infrastructure/persistence/repositories/` |
| External APIs | `infrastructure/external/` |
| Side effects | `application/event-handlers/` |
| CQRS operations | `application/commands/` + `application/queries/` |

---

**Last updated:** 2026-01-11
