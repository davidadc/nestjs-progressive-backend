# Design Patterns - Progressive Example: Payment System

**Progressive example showing how patterns evolve from Beginner to Expert**

---

## Scenario: Payment System

We will implement a payment processing system that evolves:

- Beginner: Create simple payments
- Intermediate: Multiple providers
- Advanced: Notifications and CQRS
- Expert: Event Sourcing and distributed transactions

---

## BEGINNER: Simple Service

**Requirements:**

- Process payments with Stripe
- No advanced patterns
- Simple logic

```typescript
// src/payment/payment.service.ts
@Injectable()
export class PaymentService {
  private stripeClient: Stripe;

  constructor() {
    this.stripeClient = new Stripe(process.env.STRIPE_KEY);
  }

  async processPayment(orderId: string, amount: number): Promise<Payment> {
    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });

    // Save to DB
    const payment = new Payment();
    payment.orderId = orderId;
    payment.externalId = paymentIntent.id;
    payment.amount = amount;
    payment.status = 'processing';

    // Save directly
    await db.payments.save(payment);

    return payment;
  }

  async confirmPayment(paymentId: string): Promise<Payment> {
    const payment = await db.payments.findOne(paymentId);

    const intent = await this.stripeClient.paymentIntents.retrieve(
      payment.externalId
    );

    if (intent.status === 'succeeded') {
      payment.status = 'completed';
    } else {
      payment.status = 'failed';
    }

    await db.payments.save(payment);
    return payment;
  }
}

// src/payment/payment.controller.ts
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.processPayment(dto.orderId, dto.amount);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.paymentService.confirmPayment(id);
  }
}

// main.ts
const app = await NestFactory.create(AppModule);
app.listen(3000);
```

**Problems:**

- Coupled to Stripe
- DB logic mixed in
- No notifications
- No error handling

---

## INTERMEDIATE: Multiple Providers + Patterns

**Add:**

- Repository Pattern
- Strategy Pattern
- Observer Pattern
- Facade Pattern

```typescript
// ============ REPOSITORY PATTERN ============
// src/payment/repositories/payment.repository.ts
export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment>;
}

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity) private repo: Repository<PaymentEntity>
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const entity = PaymentEntity.fromDomain(payment);
    const saved = await this.repo.save(entity);
    return saved.toDomain();
  }

  async findById(id: string): Promise<Payment> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity?.toDomain() || null;
  }
}

// ============ STRATEGY PATTERN ============
// src/payment/strategies/payment.strategy.ts
export interface IPaymentStrategy {
  process(amount: number): Promise<PaymentResult>;
  confirm(externalId: string): Promise<PaymentStatus>;
  refund(externalId: string): Promise<void>;
}

@Injectable()
export class StripePaymentStrategy implements IPaymentStrategy {
  constructor(private stripe: Stripe) {}

  async process(amount: number): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });
    return {
      externalId: intent.id,
      status: 'processing',
    };
  }

  async confirm(externalId: string): Promise<PaymentStatus> {
    const intent = await this.stripe.paymentIntents.retrieve(externalId);
    return intent.status === 'succeeded' ? 'completed' : 'failed';
  }

  async refund(externalId: string): Promise<void> {
    await this.stripe.refunds.create({ charge: externalId });
  }
}

@Injectable()
export class PaystackPaymentStrategy implements IPaymentStrategy {
  constructor(private paystack: PaystackAPI) {}

  async process(amount: number): Promise<PaymentResult> {
    const transaction = await this.paystack.initializeTransaction({
      amount: amount * 100,
    });
    return {
      externalId: transaction.reference,
      status: 'initialized',
    };
  }

  async confirm(externalId: string): Promise<PaymentStatus> {
    const status = await this.paystack.verifyTransaction(externalId);
    return status.status === 'success' ? 'completed' : 'failed';
  }

  async refund(externalId: string): Promise<void> {
    await this.paystack.refundTransaction(externalId);
  }
}

// ============ OBSERVER PATTERN ============
// src/payment/events/payment.events.ts
export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly status: PaymentStatus
  ) {}
}

export class PaymentCompletedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string
  ) {}
}

// Listeners
@Injectable()
export class SendOrderConfirmationListener {
  constructor(private emailService: EmailService) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    // Get order and send email
    await this.emailService.sendOrderConfirmation(event.orderId);
  }
}

@Injectable()
export class UpdateOrderStatusListener {
  constructor(private orderService: OrderService) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    await this.orderService.markAsPaid(event.orderId);
  }
}

// ============ FACADE PATTERN ============
// src/payment/facades/payment.facade.ts
@Injectable()
export class PaymentFacade {
  constructor(
    @Inject('PAYMENT_STRATEGY') private strategy: IPaymentStrategy,
    private paymentRepository: IPaymentRepository,
    private eventEmitter: EventEmitter2
  ) {}

  async processPaymentForOrder(
    orderId: string,
    amount: number
  ): Promise<Payment> {
    // 1. Process payment
    const paymentResult = await this.strategy.process(amount);

    // 2. Create entity
    const payment = new Payment();
    payment.orderId = orderId;
    payment.amount = amount;
    payment.externalId = paymentResult.externalId;
    payment.status = paymentResult.status;

    // 3. Save
    await this.paymentRepository.save(payment);

    // 4. Emit event
    this.eventEmitter.emit(
      'payment.processed',
      new PaymentProcessedEvent(
        payment.id,
        orderId,
        amount,
        paymentResult.status
      )
    );

    return payment;
  }

  async confirmPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new NotFoundException('Payment not found');

    // Confirm with strategy
    const status = await this.strategy.confirm(payment.externalId);
    payment.status = status;

    await this.paymentRepository.save(payment);

    // Emit event if completed
    if (status === 'completed') {
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(payment.id, payment.orderId)
      );
    }

    return payment;
  }
}

// ============ MODULE ============
@Module({
  providers: [
    PaymentFacade,
    PaymentRepository,
    SendOrderConfirmationListener,
    UpdateOrderStatusListener,
    {
      provide: 'PAYMENT_STRATEGY',
      useClass:
        process.env.PAYMENT_PROVIDER === 'stripe'
          ? StripePaymentStrategy
          : PaystackPaymentStrategy,
    },
  ],
})
export class PaymentModule {}

// ============ CONTROLLER ============
@Controller('payments')
export class PaymentController {
  constructor(private paymentFacade: PaymentFacade) {}

  @Post('orders/:orderId')
  async processPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto
  ) {
    return this.paymentFacade.processPaymentForOrder(orderId, dto.amount);
  }

  @Post(':id/confirm')
  async confirmPayment(@Param('id') id: string) {
    return this.paymentFacade.confirmPayment(id);
  }
}
```

**Improvements:**

- Change providers without modifying code
- Decoupled notifications
- Separated data logic
- More testable code

**Still problematic:**

- No change history
- Difficult to debug problems
- No read/write separation

---

## ADVANCED: CQRS + RFC 7807 Errors

**Add:**

- CQRS (Commands + Queries)
- RFC 7807 Error Handling
- Domain Events
- Value Objects

```typescript
// ============ DOMAIN LAYER ============
// src/payment/domain/value-objects/money.vo.ts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new InvalidMoneyException('Amount cannot be negative');
    }
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new IncompatibleCurrencyException();
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}

// src/payment/domain/entities/payment.aggregate.ts
export class Payment extends AggregateRoot {
  private _id: string;
  private _orderId: string;
  private _amount: Money;
  private _externalId: string;
  private _status: PaymentStatus;
  private _createdAt: Date;

  static create(props: CreatePaymentProps): Payment {
    const payment = new Payment();
    payment._id = generateId();
    payment._orderId = props.orderId;
    payment._amount = new Money(props.amount);
    payment._status = 'pending';
    payment._createdAt = new Date();

    payment.addDomainEvent(
      new PaymentCreatedEvent(
        payment._id,
        payment._orderId,
        payment._amount.amount
      )
    );

    return payment;
  }

  processPayment(externalId: string): void {
    this._externalId = externalId;
    this._status = 'processing';

    this.addDomainEvent(new PaymentProcessedEvent(this._id, this._orderId));
  }

  confirmPayment(): void {
    if (this._status !== 'processing') {
      throw new InvalidPaymentStateException(this._status);
    }
    this._status = 'completed';

    this.addDomainEvent(new PaymentCompletedEvent(this._id, this._orderId));
  }

  failPayment(reason: string): void {
    this._status = 'failed';

    this.addDomainEvent(
      new PaymentFailedEvent(this._id, this._orderId, reason)
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get amount(): Money {
    return this._amount;
  }
  get status(): PaymentStatus {
    return this._status;
  }
}

// ============ APPLICATION LAYER ============
// src/payment/application/commands/process-payment.command.ts
export class ProcessPaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly amount: number
  ) {}
}

@CommandHandler(ProcessPaymentCommand)
export class ProcessPaymentCommandHandler {
  constructor(
    @Inject('PAYMENT_STRATEGY') private strategy: IPaymentStrategy,
    private paymentRepository: IPaymentRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ProcessPaymentCommand): Promise<Payment> {
    try {
      // Create aggregate
      const payment = Payment.create({
        orderId: command.orderId,
        amount: command.amount,
      });

      // Process
      const result = await this.strategy.process(command.amount);
      payment.processPayment(result.externalId);

      // Persist
      await this.paymentRepository.save(payment);

      // Publish events
      await this.eventBus.publishAll(payment.getDomainEvents());

      return payment;
    } catch (error) {
      if (error instanceof InvalidMoneyException) {
        throw new HttpException(
          ProblemDetailsFactory.invalidInput(
            'amount',
            'Amount must be positive',
            '/payments'
          ),
          400
        );
      }
      throw error;
    }
  }
}

// src/payment/application/queries/get-payment-status.query.ts
export class GetPaymentStatusQuery {
  constructor(public readonly paymentId: string) {}
}

@QueryHandler(GetPaymentStatusQuery)
export class GetPaymentStatusQueryHandler {
  constructor(private paymentRepository: IPaymentRepository) {}

  async execute(query: GetPaymentStatusQuery): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(query.paymentId);

    if (!payment) {
      throw new HttpException(
        ProblemDetailsFactory.notFound('Payment', query.paymentId, '/payments'),
        404
      );
    }

    return new PaymentResponseDto(payment);
  }
}

// ============ EVENT HANDLERS ============
// src/payment/application/events/payment-completed.handler.ts
@EventsHandler(PaymentCompletedEvent)
export class PaymentCompletedEventHandler {
  constructor(
    private orderService: OrderService,
    private emailService: EmailService,
    private analyticsService: AnalyticsService
  ) {}

  async handle(event: PaymentCompletedEvent): Promise<void> {
    // Update order
    await this.orderService.markAsPaid(event.orderId);

    // Send email
    await this.emailService.sendConfirmation(event.orderId);

    // Record analytics
    await this.analyticsService.trackPaymentCompleted(event);
  }
}

// ============ CONTROLLER ============
@Controller('api/v1/payments')
export class PaymentController {
  constructor(private cqrs: CqrsModule) {}

  @Post('orders/:orderId')
  async processPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto,
    @Req() req: Request
  ) {
    try {
      const command = new ProcessPaymentCommand(orderId, dto.amount);
      const payment = await this.cqrs.commandBus.execute(command);

      return {
        success: true,
        statusCode: 201,
        data: payment,
      };
    } catch (error) {
      // RFC 7807 error handling in global filter
      throw error;
    }
  }

  @Get(':id')
  async getPaymentStatus(@Param('id') id: string) {
    const query = new GetPaymentStatusQuery(id);
    const payment = await this.cqrs.queryBus.execute(query);

    return {
      success: true,
      statusCode: 200,
      data: payment,
    };
  }
}
```

**Improvements:**

- Read/write separation (CQRS)
- RFC 7807 errors
- Value Objects for validation
- Domain Events
- Decoupled Event Handlers

**Still missing:**

- Complete event history
- Distributed transactions
- Failure recovery

---

## EXPERT: Event Sourcing + Sagas

**Add:**

- Event Sourcing (save events, not state)
- Saga Pattern (distributed transactions)
- Event Store
- Temporal Queries

```typescript
// ============ EVENT SOURCING ============
// src/payment/infrastructure/event-store/event.store.ts
@Injectable()
export class EventStore {
  constructor(
    @InjectRepository(StoredEventEntity)
    private eventRepo: Repository<StoredEventEntity>
  ) {}

  async append(aggregateId: string, event: DomainEvent): Promise<void> {
    const storedEvent = new StoredEventEntity();
    storedEvent.aggregateId = aggregateId;
    storedEvent.eventType = event.constructor.name;
    storedEvent.eventData = JSON.stringify(event);
    storedEvent.occurredAt = event.occurredAt;
    storedEvent.aggregateType = 'Payment';

    await this.eventRepo.save(storedEvent);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const entities = await this.eventRepo.find({
      where: { aggregateId },
      order: { occurredAt: 'ASC' },
    });

    return entities.map((e) => this.deserializeEvent(JSON.parse(e.eventData)));
  }

  async getAllEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    const entities = await this.eventRepo.find({
      where: { occurredAt: MoreThan(timestamp) },
      order: { occurredAt: 'ASC' },
    });

    return entities.map((e) => this.deserializeEvent(JSON.parse(e.eventData)));
  }

  private deserializeEvent(data: any): DomainEvent {
    switch (data.type) {
      case 'PaymentCreatedEvent':
        return new PaymentCreatedEvent(data.orderId, data.amount);
      case 'PaymentProcessedEvent':
        return new PaymentProcessedEvent(data.paymentId, data.orderId);
      // ... more types
      default:
        throw new Error(`Unknown event type: ${data.type}`);
    }
  }
}

// ============ EVENT SOURCED REPOSITORY ============
// src/payment/infrastructure/repositories/event-sourced-payment.repository.ts
@Injectable()
export class EventSourcedPaymentRepository implements IPaymentRepository {
  constructor(
    private eventStore: EventStore,
    @InjectRepository(PaymentReadModel)
    private readModelRepo: Repository<PaymentReadModel>
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const events = payment.getUncommittedEvents();

    for (const event of events) {
      await this.eventStore.append(payment.id, event);
      // Update read model
      await this.updateReadModel(event);
    }

    payment.markEventsAsCommitted();
    return payment;
  }

  async findById(id: string): Promise<Payment | null> {
    const events = await this.eventStore.getEvents(id);
    if (events.length === 0) return null;

    return Payment.fromHistory(events);
  }

  async findByIdAtTime(id: string, timestamp: Date): Promise<Payment | null> {
    // Temporal query - reconstruct state at specific point
    const allEvents = await this.eventStore.getEvents(id);
    const eventsAtTime = allEvents.filter((e) => e.occurredAt <= timestamp);

    if (eventsAtTime.length === 0) return null;
    return Payment.fromHistory(eventsAtTime);
  }

  private async updateReadModel(event: DomainEvent): Promise<void> {
    // Update materialized view for fast reads
    const readModel = await this.readModelRepo.findOne({
      where: { paymentId: event.aggregateId },
    });

    if (event instanceof PaymentCreatedEvent) {
      const model = new PaymentReadModel();
      model.paymentId = event.aggregateId;
      model.orderId = event.orderId;
      model.amount = event.amount;
      model.status = 'created';
      await this.readModelRepo.save(model);
    } else if (event instanceof PaymentCompletedEvent && readModel) {
      readModel.status = 'completed';
      await this.readModelRepo.save(readModel);
    }
  }
}

// ============ SAGA PATTERN ============
// src/payment/application/sagas/payment-order.saga.ts
@Injectable()
export class PaymentOrderSaga {
  constructor(private eventBus: EventBus, private commandBus: CommandBus) {
    this.eventBus.subscribe(PaymentCompletedEvent, (event) =>
      this.onPaymentCompleted(event)
    );

    this.eventBus.subscribe(PaymentFailedEvent, (event) =>
      this.onPaymentFailed(event)
    );
  }

  private async onPaymentCompleted(
    event: PaymentCompletedEvent
  ): Promise<void> {
    try {
      // Step 1: Payment completed

      // Step 2: Confirm inventory
      const confirmCommand = new ConfirmInventoryCommand(event.orderId);
      await this.commandBus.execute(confirmCommand);

      // Step 3: Send notification
      const notifyCommand = new SendOrderConfirmationCommand(event.orderId);
      await this.commandBus.execute(notifyCommand);
    } catch (error) {
      // Compensation: Revert payment
      const refundCommand = new RefundPaymentCommand(event.paymentId);
      await this.commandBus.execute(refundCommand);

      // Release inventory
      const releaseCommand = new ReleaseInventoryCommand(event.orderId);
      await this.commandBus.execute(releaseCommand);
    }
  }

  private async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Notify customer
    const notifyCommand = new NotifyPaymentFailureCommand(
      event.orderId,
      event.reason
    );
    await this.commandBus.execute(notifyCommand);
  }
}

// ============ TEMPORAL QUERIES ============
// src/payment/application/queries/get-payment-history.query.ts
export class GetPaymentHistoryQuery {
  constructor(public readonly paymentId: string) {}
}

@QueryHandler(GetPaymentHistoryQuery)
export class GetPaymentHistoryQueryHandler {
  constructor(private eventStore: EventStore) {}

  async execute(query: GetPaymentHistoryQuery): Promise<DomainEvent[]> {
    return this.eventStore.getEvents(query.paymentId);
  }
}

// Example: View payment status from 5 minutes ago
@QueryHandler(GetPaymentStatusAtTimeQuery)
export class GetPaymentStatusAtTimeQueryHandler {
  constructor(private paymentRepository: EventSourcedPaymentRepository) {}

  async execute(query: GetPaymentStatusAtTimeQuery): Promise<Payment> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.paymentRepository.findByIdAtTime(
      query.paymentId,
      fiveMinutesAgo
    );
  }
}
```

**Improvements:**

- Complete history (Event Sourcing)
- Distributed transactions (Sagas)
- Temporal queries (time travel)
- Complete auditing
- Perfect recovery

**Advanced Capabilities:**

- Reconstruct state at any point in time
- Replay events for debugging
- Separate projections (read models)
- Resilience against failures

---

## Comparison of Implementations

> **Note:** The patterns listed here are those used in this specific example (Payment System).
> For the total patterns available per level, see ARCHITECTURE.md.

| Aspect                         | Beginner  | Intermediate | Advanced  | Expert    |
| ------------------------------ | --------- | ------------ | --------- | --------- |
| **Lines of code**              | 80        | 250          | 450       | 700+      |
| **Patterns (in this example)** | 0         | 4            | 7         | 11        |
| **Testability**                | Medium    | High         | Very High | Maximum   |
| **Maintainability**            | Low       | Medium       | High      | Very High |
| **Scalability**                | Low       | Medium       | High      | Maximum   |
| **Complexity**                 | Low       | Medium       | High      | Very High |
| **Debugging**                  | Difficult | Medium       | Easy      | Trivial   |
| **Business changes**           | Difficult | Medium       | Easy      | Trivial   |

---

## When to Use Each Level

### **Beginner**

- Small projects
- POC/MVP
- Teams without experience
- Tight timeline

### **Intermediate**

- Medium projects
- Multiple providers
- Team with some experience
- Need for notifications

### **Advanced**

- Large projects
- Complex logic
- Experienced team
- Regulatory compliance

### **Expert**

- Critical systems
- Very high concurrency
- Multiple teams
- Total audit requirements

---

**Last updated:** 2026-01-02
**Use case:** Payment Processing System
**Objective:** Show natural evolution of patterns
