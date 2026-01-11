# Payment Integration API

Payment integration API with Stripe/Paystack support, featuring webhook handling, transaction auditing, CQRS architecture, and RFC 7807 error responses.

**Level:** Advanced
**ORM:** TypeORM

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** TypeORM
- **Testing:** Jest + Supertest
- **Payment Provider:** Stripe (Paystack optional)
- **Architecture:** DDD + CQRS

---

## Features

- [x] Payment provider integration (Stripe)
- [x] Paystack provider support (Strategy pattern)
- [x] Webhook handling with signature validation
- [x] Webhook retry logic with exponential backoff
- [x] Payment state machine (pending -> processing -> completed/failed)
- [x] Transaction audit logging
- [x] RFC 7807 Problem Details for errors
- [x] CQRS pattern (Commands/Queries separation)
- [x] Domain Events for payment lifecycle
- [x] Idempotency key handling
- [x] Rate limiting (multi-tier)
- [x] Health checks (database, payment providers)

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- pnpm (recommended) or npm/yarn
- Stripe account with test API keys

---

## Getting Started

### 1. Start Docker Services

From the monorepo root:

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd projects/advanced/payment-integration-api
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Stripe keys and other settings
```

### 4. Setup Database

```bash
pnpm run typeorm migration:run
```

### 5. Run Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

---

## Available Scripts

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `pnpm run start:dev`  | Start in development mode (watch) |
| `pnpm run start`      | Start in production mode          |
| `pnpm run build`      | Build for production              |
| `pnpm run test`       | Run unit tests                    |
| `pnpm run test:watch` | Run tests in watch mode           |
| `pnpm run test:cov`   | Run tests with coverage           |
| `pnpm run test:e2e`   | Run E2E tests                     |
| `pnpm run lint`       | Run ESLint                        |
| `pnpm run format`     | Format with Prettier              |

### Database Commands (TypeORM)

| Command                                              | Description           |
| ---------------------------------------------------- | --------------------- |
| `pnpm run typeorm migration:generate -- --name Name` | Generate migration    |
| `pnpm run typeorm migration:run`                     | Run migrations        |
| `pnpm run typeorm migration:revert`                  | Revert last migration |

---

## Project Structure

```
src/
├── payments/                  # Payment feature module (DDD)
│   ├── domain/               # Aggregates, Value Objects, Events
│   ├── application/          # Commands, Queries, DTOs, Mappers
│   └── infrastructure/       # Controllers, Repositories, External
├── orders/                    # Order feature module
├── common/                    # Shared utilities, RFC 7807, base classes
├── config/                    # Configuration modules
├── app.module.ts
└── main.ts

test/
├── unit/                      # Unit tests
├── integration/               # Integration tests
└── e2e/                       # End-to-end tests
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
| ------ | -------- | ----------- | ---- |
| `POST` | `/api/v1/orders/:id/checkout` | Initiate payment | Yes |
| `GET` | `/api/v1/orders/:id/payment-status` | Get payment status | Yes |
| `POST` | `/api/v1/webhooks/stripe` | Handle Stripe webhooks | Signature |
| `GET` | `/api/v1/transactions` | List transactions | Admin |
| `POST` | `/api/v1/payments/:id/refund` | Initiate refund | Admin |

### Example Request

```bash
# Initiate payment
curl -X POST http://localhost:3000/api/v1/orders/abc-123/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"currency": "USD"}'
```

### Example Response

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "pay_xyz789",
    "orderId": "abc-123",
    "amount": 99.99,
    "currency": "USD",
    "status": "processing",
    "provider": "stripe",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

### Error Response (RFC 7807)

```json
{
  "type": "https://api.example.com/errors/payment-failed",
  "title": "Payment Failed",
  "status": 402,
  "detail": "Payment was declined by the card issuer.",
  "instance": "POST /api/v1/orders/abc-123/checkout",
  "timestamp": "2026-01-11T10:00:00Z",
  "traceId": "req-abc-123"
}
```

---

## Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `dev` |
| `DATABASE_PASSWORD` | Database password | `dev` |
| `DATABASE_NAME` | Database name | `payment_db` |
| `PORT` | Application port | `3000` |
| `JWT_SECRET` | JWT signing secret | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | - |

---

## Webhook Setup

### Local Development (Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

### Production

Configure webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/v1/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

---

## Testing

### Run Unit Tests

```bash
pnpm run test
```

### Run with Coverage

```bash
pnpm run test:cov
```

Coverage target: **80% minimum**

### Run E2E Tests

```bash
pnpm run test:e2e
```

### Run API Integration Tests

```bash
./scripts/test-api.sh
```

---

## Documentation

- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - Context for Claude Code
- **[PROGRESS.md](./PROGRESS.md)** - Implementation tracking
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture decisions
- **[Swagger UI](http://localhost:3000/docs)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions

---

## Development Checklist

- [x] Environment configured
- [x] Database migrations run
- [x] Stripe keys configured
- [x] All endpoints implemented
- [x] RFC 7807 error handling
- [x] Webhook signature validation
- [x] Unit tests written (80%+ coverage)
- [x] E2E tests written
- [x] Swagger documentation added
- [x] Health checks implemented
- [x] Rate limiting configured
- [x] Idempotency handling added

---

## Security Considerations

- **Never store card data** - Use Stripe tokenization
- **Validate webhook signatures** - Prevent replay attacks
- **Idempotent operations** - Handle duplicate webhooks
- **Audit logging** - Record all transactions
- **Rate limiting** - Protect payment endpoints

---

## Troubleshooting

### Database Connection Failed

```bash
# Check if Docker is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Stripe Webhook Not Received

```bash
# Verify Stripe CLI is running
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Check webhook secret matches .env
echo $STRIPE_WEBHOOK_SECRET
```

### Migration Issues

```bash
# Revert last migration
pnpm run typeorm migration:revert

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
pnpm run typeorm migration:run
```

---

## Potential Improvements

The following enhancements could be added to extend the functionality of this payment integration API:

### Infrastructure & Scalability

- **Redis for Rate Limiting**: Replace in-memory throttler storage with Redis for horizontal scaling across multiple instances
- **Redis for Idempotency Cache**: Use Redis for distributed idempotency key storage with automatic TTL
- **Message Queue Integration**: Add RabbitMQ/Redis queues for async webhook processing and event-driven architecture
- **Database Read Replicas**: Configure TypeORM for read/write splitting to improve query performance

### Payment Features

- **Subscription/Recurring Payments**: Implement subscription management with billing cycles, plan upgrades/downgrades
- **Payment Method Tokenization**: Store payment methods securely for one-click checkout
- **Multi-Currency Support**: Add currency conversion with real-time exchange rates
- **Partial Payments**: Support installment payments and split payments
- **Payment Links**: Generate shareable payment links for invoices
- **Dispute/Chargeback Handling**: Automated dispute management workflow

### Monitoring & Observability

- **OpenTelemetry Integration**: Distributed tracing across payment flows
- **Metrics Dashboard**: Prometheus/Grafana for payment success rates, latency, and error tracking
- **Alert System**: Automated alerts for payment failures, webhook delivery issues, and provider outages
- **Audit Log Export**: Export transaction logs to external systems (S3, BigQuery) for compliance

### Security Enhancements

- **PCI DSS Compliance Tooling**: Automated compliance checks and reporting
- **Fraud Detection**: ML-based fraud scoring integration (Stripe Radar, custom rules)
- **3D Secure 2.0**: Enhanced authentication for card payments
- **IP Allowlisting**: Restrict webhook endpoints to provider IP ranges
- **Request Signing**: Sign outgoing API requests for additional security

### Developer Experience

- **Admin Dashboard UI**: React/Next.js dashboard for payment management
- **SDK Generation**: Auto-generate client SDKs from OpenAPI spec
- **Webhook Testing UI**: Built-in webhook replay and testing interface
- **GraphQL API**: Alternative GraphQL endpoint for flexible querying
- **WebSocket Notifications**: Real-time payment status updates to clients

### Testing & Quality

- **Contract Testing**: Pact tests for provider API contracts
- **Chaos Engineering**: Resilience testing with simulated failures
- **Load Testing**: k6/Artillery scripts for performance benchmarking
- **Snapshot Testing**: Response snapshot tests for API stability

---

## License

MIT

---

**Last updated:** 2026-01-11
