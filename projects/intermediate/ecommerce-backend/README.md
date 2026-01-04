# E-commerce Backend

Complete online store backend API with product catalog, shopping cart, orders, and reviews.

**Level:** Intermediate
**ORM:** TypeORM

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** TypeORM
- **Authentication:** JWT + Passport
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

---

## Features

- [x] User authentication (register, login, JWT)
- [x] Role-based authorization (customer, admin)
- [x] Product catalog with categories
- [x] Product search and filtering
- [x] Shopping cart management
- [x] Order processing with stock validation
- [x] Product reviews and ratings
- [x] Soft deletes for products
- [x] API versioning (/api/v1)
- [x] Response envelopes
- [x] Swagger documentation

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- pnpm (recommended) or npm/yarn

---

## Getting Started

### 1. Start Docker Services

From the monorepo root:

```bash
docker-compose up -d postgres
```

### 2. Install Dependencies

```bash
cd projects/intermediate/ecommerce-backend
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
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

Swagger docs at `http://localhost:3000/api`

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
├── auth/                 # Authentication module
│   ├── domain/           # User entity, repository interface
│   ├── application/      # DTOs, AuthService, mappers
│   └── infrastructure/   # Controller, guards, JWT strategy
├── products/             # Products module
│   ├── domain/           # Product, Category entities
│   ├── application/      # DTOs, services, mappers
│   └── infrastructure/   # Controllers, repositories
├── cart/                 # Shopping cart module
│   ├── domain/           # Cart, CartItem entities
│   ├── application/      # DTOs, CartService, mappers
│   └── infrastructure/   # Controller, repository
├── orders/               # Orders module
│   ├── domain/           # Order, OrderItem entities
│   ├── application/      # DTOs, OrdersService, CreateOrderUseCase
│   └── infrastructure/   # Controller, repository
├── reviews/              # Reviews module
│   ├── domain/           # Review entity
│   ├── application/      # DTOs, ReviewsService
│   └── infrastructure/   # Controller, repository
├── common/               # Shared utilities
│   ├── decorators/       # @CurrentUser, @Roles, @Public
│   ├── filters/          # Exception filters
│   └── interceptors/     # Response envelope interceptor
├── config/               # Configuration
├── app.module.ts
└── main.ts
```

---

## API Endpoints

### Authentication

| Method | Endpoint               | Description      | Auth     |
| ------ | ---------------------- | ---------------- | -------- |
| POST   | `/api/v1/auth/register` | Register user    | No       |
| POST   | `/api/v1/auth/login`    | Login            | No       |
| GET    | `/api/v1/auth/profile`  | Get profile      | Required |

### Products

| Method | Endpoint                | Description          | Auth          |
| ------ | ----------------------- | -------------------- | ------------- |
| GET    | `/api/v1/products`      | List products        | No            |
| GET    | `/api/v1/products/:id`  | Get product          | No            |
| POST   | `/api/v1/products`      | Create product       | Admin         |
| PUT    | `/api/v1/products/:id`  | Update product       | Admin         |
| DELETE | `/api/v1/products/:id`  | Delete product       | Admin         |

### Categories

| Method | Endpoint                  | Description      | Auth  |
| ------ | ------------------------- | ---------------- | ----- |
| GET    | `/api/v1/categories`      | List categories  | No    |
| POST   | `/api/v1/categories`      | Create category  | Admin |
| PUT    | `/api/v1/categories/:id`  | Update category  | Admin |
| DELETE | `/api/v1/categories/:id`  | Delete category  | Admin |

### Cart

| Method | Endpoint                  | Description       | Auth     |
| ------ | ------------------------- | ----------------- | -------- |
| GET    | `/api/v1/cart`            | Get cart          | Required |
| POST   | `/api/v1/cart/items`      | Add to cart       | Required |
| PATCH  | `/api/v1/cart/items/:id`  | Update quantity   | Required |
| DELETE | `/api/v1/cart/items/:id`  | Remove item       | Required |
| DELETE | `/api/v1/cart`            | Clear cart        | Required |

### Orders

| Method | Endpoint              | Description    | Auth     |
| ------ | --------------------- | -------------- | -------- |
| POST   | `/api/v1/orders`      | Create order   | Required |
| GET    | `/api/v1/orders`      | List orders    | Required |
| GET    | `/api/v1/orders/:id`  | Get order      | Required |

### Reviews

| Method | Endpoint                        | Description     | Auth     |
| ------ | ------------------------------- | --------------- | -------- |
| GET    | `/api/v1/products/:id/reviews`  | Get reviews     | No       |
| POST   | `/api/v1/products/:id/reviews`  | Create review   | Required |

---

## Example Requests

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### List Products

```bash
curl "http://localhost:3000/api/v1/products?page=1&limit=10&search=laptop"
```

### Add to Cart

```bash
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "uuid",
    "quantity": 2
  }'
```

### Create Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "shippingAddressId": "address-uuid"
  }'
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-04T10:00:00Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "message": "Validation failed",
    "details": [...]
  }
}
```

---

## Environment Variables

| Variable            | Description       | Default        |
| ------------------- | ----------------- | -------------- |
| `DATABASE_HOST`     | PostgreSQL host   | `localhost`    |
| `DATABASE_PORT`     | PostgreSQL port   | `5432`         |
| `DATABASE_USER`     | Database user     | `admin`        |
| `DATABASE_PASSWORD` | Database password | `admin`        |
| `DATABASE_NAME`     | Database name     | `ecommerce_db` |
| `JWT_SECRET`        | JWT secret key    | -              |
| `JWT_EXPIRATION`    | Token expiration  | `3600`         |
| `PORT`              | Application port  | `3000`         |

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

---

## Documentation

- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - Context for Claude Code
- **[PROGRESS.md](./PROGRESS.md)** - Implementation progress
- **[Swagger UI](http://localhost:3000/api)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] Auth endpoints implemented
- [ ] Product CRUD implemented
- [ ] Category CRUD implemented
- [ ] Cart management implemented
- [ ] Order processing implemented
- [ ] Reviews implemented
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Unit tests written (80%+ coverage)
- [ ] E2E tests written
- [ ] Swagger documentation added

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

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process or use different port
PORT=3001 pnpm run start:dev
```

### Migration Issues

```bash
# Revert last migration
pnpm run typeorm migration:revert

# Re-run migrations
pnpm run typeorm migration:run
```

---

## License

MIT

---

**Last updated:** 2026-01-04
