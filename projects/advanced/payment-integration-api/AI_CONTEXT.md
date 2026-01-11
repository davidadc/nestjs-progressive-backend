# AI_CONTEXT.md - Context for Claude Code

---

## Project Information

**Name:** Payment Integration API
**Level:** Advanced
**Description:** Payment integration API with Stripe/Paystack, featuring webhook handling, transaction auditing, CQRS, and RFC 7807 error responses.
**ORM:** TypeORM
**Stack:** NestJS + TypeScript + PostgreSQL + TypeORM + Stripe SDK

---

## Project Structure

### Advanced Level (Modular + Full DDD)

```
src/
├── payments/                      # Payment feature module with DDD
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
│   │   │   ├── process-webhook.command.ts
│   │   │   └── refund-payment.command.ts
│   │   ├── queries/
│   │   │   ├── get-payment-status.query.ts
│   │   │   └── list-transactions.query.ts
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
│
├── orders/                        # Order feature module
│   ├── orders.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── common/
│   ├── domain/                    # Base DDD classes
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── exceptions/                # RFC 7807 implementation
│   │   ├── problem-details.ts
│   │   ├── problem-details.factory.ts
│   │   └── problem-details.filter.ts
│   ├── decorators/
│   ├── guards/
│   │   └── webhook-signature.guard.ts
│   └── interceptors/
│
├── config/
│   ├── database.config.ts
│   ├── payment.config.ts
│   └── app.config.ts
│
├── app.module.ts
└── main.ts

test/
├── unit/
│   ├── payment.aggregate.spec.ts
│   └── money.vo.spec.ts
├── integration/
│   └── payment.repository.spec.ts
└── e2e/
    └── payment.e2e-spec.ts
```

---

## Architecture

### Advanced (5+ layers with DDD + CQRS)

```
Controller → Command/Query Handler → Domain (Aggregates) → Repository
                    ↓
            Domain Events → Event Handlers
```

**Patterns Used:**

- Repository Pattern
- Factory Pattern
- Strategy Pattern (Stripe vs Paystack)
- Observer Pattern (Domain Events)
- CQRS (Commands/Queries)
- Aggregate Root
- Value Objects
- Mediator Pattern (CommandBus/QueryBus)
- RFC 7807 Problem Details

**Command Flow (Write Operations):**

```
HTTP Request (POST /orders/:id/checkout)
    ↓
PaymentController.initiatePayment()
    ↓
CommandBus.execute(InitiatePaymentCommand)
    ↓
InitiatePaymentHandler
    ↓
Payment.create() → Domain Event (PaymentCreated)
    ↓
IPaymentRepository.save()
    ↓
IPaymentStrategy.process() → External Provider (Stripe)
    ↓
EventBus.publish(PaymentProcessedEvent)
    ↓
Event Handlers (Update order, Send notification)
```

**Query Flow (Read Operations):**

```
HTTP Request (GET /orders/:id/payment-status)
    ↓
PaymentController.getPaymentStatus()
    ↓
QueryBus.execute(GetPaymentStatusQuery)
    ↓
GetPaymentStatusHandler
    ↓
IPaymentRepository.findByOrderId()
    ↓
PaymentMapper.toDto()
    ↓
PaymentResponseDto
```

---

## Entities

### Payment Aggregate

```typescript
export class Payment extends AggregateRoot {
  private _id: PaymentId;
  private _orderId: OrderId;
  private _amount: Money;
  private _status: PaymentStatus;
  private _provider: 'stripe' | 'paystack';
  private _externalId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  static create(props: CreatePaymentProps): Payment;
  processPayment(externalId: string): void;
  confirmPayment(): void;
  failPayment(reason: string): void;
  refund(): void;
}
```

### Value Objects

**Money** (amount + currency)
- amount: number (positive, 2 decimal places max)
- currency: string ('USD', 'EUR', 'NGN')
- Methods: add(), subtract(), equals()

**PaymentId** (UUID wrapper)
- value: string (UUID v4)
- Methods: generate(), create()

**PaymentStatus** (enum with transitions)
- values: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
- Methods: canTransitionTo()

### DTOs

**InitiatePaymentDto** (input)
- orderId: string (required, UUID)
- currency?: string (optional, default 'USD')
- returnUrl?: string (optional, for redirects)

**PaymentResponseDto** (output)
- id: string
- orderId: string
- amount: number
- currency: string
- status: string
- provider: string
- checkoutUrl?: string
- createdAt: Date

---

## Security Requirements

### Authentication

- [x] JWT tokens (for regular endpoints)
- [x] Webhook signature validation (for webhooks)

### Authorization

- [x] User can only view their own orders/payments
- [x] Admin can view all transactions

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization
- [x] Amount validation (positive, reasonable limits)

### Error Handling (RFC 7807)

```typescript
// Error response format
{
  "type": "https://api.example.com/errors/payment-failed",
  "title": "Payment Failed",
  "status": 402,
  "detail": "Payment was declined by the card issuer.",
  "instance": "POST /api/v1/orders/abc-123/checkout",
  "timestamp": "2026-01-11T10:00:00Z",
  "traceId": "req-xyz-789",
  "extensions": {
    "orderId": "abc-123",
    "declineCode": "insufficient_funds"
  }
}
```

---

## Endpoints

### POST /api/v1/orders/:orderId/checkout

**Description:** Initiate payment for an order

**Request:**

```json
{
  "currency": "USD",
  "returnUrl": "https://example.com/payment/complete"
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "pay_abc123",
    "orderId": "order_xyz789",
    "amount": 99.99,
    "currency": "USD",
    "status": "processing",
    "provider": "stripe",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

**Error (402 - Payment Required):**

```json
{
  "type": "https://api.example.com/errors/payment-failed",
  "title": "Payment Failed",
  "status": 402,
  "detail": "Unable to create payment session.",
  "instance": "POST /api/v1/orders/order_xyz789/checkout"
}
```

### GET /api/v1/orders/:orderId/payment-status

**Description:** Get payment status for an order

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "pay_abc123",
    "orderId": "order_xyz789",
    "amount": 99.99,
    "currency": "USD",
    "status": "completed",
    "provider": "stripe",
    "completedAt": "2026-01-11T10:05:00Z"
  }
}
```

### POST /api/v1/webhooks/stripe

**Description:** Handle Stripe webhooks

**Headers:**
- `Stripe-Signature`: Webhook signature for validation

**Request Body:** Raw Stripe event payload

**Success (200):**

```json
{
  "received": true
}
```

### GET /api/v1/transactions

**Description:** List transaction history (Admin only)

**Query Parameters:**
- page: number (default: 1)
- limit: number (default: 20)
- status: string (optional filter)
- paymentId: string (optional filter)

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "txn_abc123",
      "paymentId": "pay_xyz789",
      "type": "charge",
      "amount": 99.99,
      "currency": "USD",
      "status": "succeeded",
      "timestamp": "2026-01-11T10:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('Payment Aggregate', () => {
  describe('create', () => {
    it('should create a payment with pending status');
    it('should emit PaymentCreatedEvent');
    it('should throw when amount is invalid');
  });

  describe('confirmPayment', () => {
    it('should transition from processing to completed');
    it('should emit PaymentCompletedEvent');
    it('should throw when status is not processing');
  });
});

describe('Money Value Object', () => {
  it('should create valid money with positive amount');
  it('should throw for negative amounts');
  it('should correctly compare two money values');
  it('should correctly add two money values');
});
```

### E2E Tests

```typescript
describe('Payment API E2E', () => {
  describe('POST /orders/:id/checkout', () => {
    it('should initiate payment and return checkout URL');
    it('should return 404 for non-existent order');
    it('should return 400 for already paid order');
  });

  describe('POST /webhooks/stripe', () => {
    it('should process payment.intent.succeeded event');
    it('should update order status on successful payment');
    it('should reject invalid signatures');
  });
});
```

---

## Dependencies

### Core

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/cqrs": "^10.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### ORM (TypeORM)

```json
{
  "typeorm": "^0.3.0",
  "@nestjs/typeorm": "^10.0.0",
  "pg": "^8.11.0"
}
```

### Project-Specific

```json
{
  "stripe": "^14.0.0",
  "@nestjs/swagger": "^7.0.0",
  "uuid": "^9.0.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dev
DATABASE_PASSWORD=dev
DATABASE_NAME=payment_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=900

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# App
NODE_ENV=development
PORT=3000
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Aggregates: `*.aggregate.ts`
- Value Objects: `*.vo.ts`
- Commands: `*.command.ts`
- Queries: `*.query.ts`
- Events: `*.event.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for Payment Integration API with Advanced DDD + CQRS architecture"
```

### 2. Domain Layer

```
"Implement Payment aggregate with Money value object, PaymentStatus transitions, and domain events"
```

### 3. Application Layer

```
"Implement InitiatePaymentCommand handler with Stripe strategy and event publishing"
```

### 4. Infrastructure Layer

```
"Implement PaymentController with RFC 7807 error handling and WebhookController with signature validation"
```

### 5. Testing

```
"Create unit tests for Payment aggregate and Money value object, then E2E tests for payment flow"
```

---

## Learning Goals

Upon completing this project:

- [ ] Understand DDD concepts (Aggregates, Value Objects, Domain Events)
- [ ] Implement CQRS pattern with CommandBus and QueryBus
- [ ] Integrate external payment provider (Stripe)
- [ ] Handle webhooks securely with signature validation
- [ ] Implement RFC 7807 Problem Details for errors
- [ ] Build transaction audit logging

---

## Next Steps

After completion:

1. Add Paystack as alternative provider
2. Implement subscription/recurring payments
3. Add payment analytics dashboard

Then proceed to: **Real-time Notification System**

---

## Quick Reference

**Where does X go? (Advanced DDD Structure)**

- Business logic (state changes) → `domain/aggregates/`
- Business rules (validation) → `domain/value-objects/`
- Side effects → `application/event-handlers/`
- CRUD operations → `application/commands/` and `application/queries/`
- DTOs → `application/dto/`
- Entity-DTO conversion → `application/mappers/`
- Database access → `infrastructure/persistence/repositories/`
- HTTP handling → `infrastructure/controllers/`
- External services → `infrastructure/external/`

**ORM Commands (TypeORM):**

```bash
pnpm run typeorm migration:generate -- --name MigrationName
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

---

**Last updated:** 2026-01-11
**To use:** Run `claude code` from this project directory
