# AI_CONTEXT.md - E-commerce Backend

**Context for Claude Code when working on this project.**

---

## Project Information

**Name:** E-commerce Backend
**Level:** Intermediate
**Description:** Complete online store backend with product catalog, shopping cart, orders, and reviews.
**ORM:** TypeORM
**Stack:** NestJS + TypeScript + PostgreSQL + TypeORM + JWT

---

## Project Structure

### Intermediate Level (Modular + Clean Architecture)

```
src/
├── auth/                              # Auth feature module
│   ├── auth.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── persistence/
│       │   ├── user.orm-entity.ts
│       │   └── user.repository.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   └── roles.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── products/                          # Products feature module
│   ├── products.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── product.entity.ts
│   │   │   └── category.entity.ts
│   │   └── repositories/
│   │       ├── product.repository.interface.ts
│   │       └── category.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   ├── update-product.dto.ts
│   │   │   ├── filter-products.dto.ts
│   │   │   ├── product-response.dto.ts
│   │   │   ├── create-category.dto.ts
│   │   │   └── category-response.dto.ts
│   │   ├── services/
│   │   │   ├── products.service.ts
│   │   │   └── categories.service.ts
│   │   └── mappers/
│   │       ├── product.mapper.ts
│   │       └── category.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   ├── products.controller.ts
│       │   └── categories.controller.ts
│       └── persistence/
│           ├── product.orm-entity.ts
│           ├── category.orm-entity.ts
│           ├── product.repository.ts
│           └── category.repository.ts
│
├── cart/                              # Cart feature module
│   ├── cart.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── cart.entity.ts
│   │   │   └── cart-item.entity.ts
│   │   └── repositories/
│   │       └── cart.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── add-to-cart.dto.ts
│   │   │   ├── update-cart-item.dto.ts
│   │   │   └── cart-response.dto.ts
│   │   ├── services/
│   │   │   └── cart.service.ts
│   │   └── mappers/
│   │       └── cart.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── cart.controller.ts
│       └── persistence/
│           ├── cart.orm-entity.ts
│           ├── cart-item.orm-entity.ts
│           └── cart.repository.ts
│
├── orders/                            # Orders feature module
│   ├── orders.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   └── order-item.entity.ts
│   │   └── repositories/
│   │       └── order.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts
│   │   │   └── order-response.dto.ts
│   │   ├── services/
│   │   │   └── orders.service.ts
│   │   ├── use-cases/
│   │   │   └── create-order.use-case.ts
│   │   └── mappers/
│   │       └── order.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── orders.controller.ts
│       └── persistence/
│           ├── order.orm-entity.ts
│           ├── order-item.orm-entity.ts
│           └── order.repository.ts
│
├── reviews/                           # Reviews feature module
│   ├── reviews.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── review.entity.ts
│   │   └── repositories/
│   │       └── review.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-review.dto.ts
│   │   │   └── review-response.dto.ts
│   │   ├── services/
│   │   │   └── reviews.service.ts
│   │   └── mappers/
│   │       └── review.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── reviews.controller.ts
│       └── persistence/
│           ├── review.orm-entity.ts
│           └── review.repository.ts
│
├── common/                            # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── dto/
│   │   └── pagination.dto.ts
│   └── types/
│       └── index.ts
│
├── config/                            # App configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── app.module.ts
└── main.ts
```

---

## Architecture

### Intermediate (4 layers)

```
Controller → Service/UseCase → Domain Entity → Repository
```

**Patterns Used:**

- Repository Pattern (data access abstraction)
- Factory Pattern (entity creation)
- Singleton Pattern (configuration)
- Decorator Pattern (guards, custom decorators)
- Builder Pattern (complex DTOs)
- Facade Pattern (service orchestration)

**Flow:**

```
HTTP Request
    ↓
Controller (validates request, extracts user)
    ↓
Service / UseCase (business logic, transactions)
    ↓
Repository (data access via interface)
    ↓
TypeORM Entity → Database
```

---

## Entities

### User Entity

```typescript
export class User {
  id: string;
  email: string;
  password: string; // Hashed
  name: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Entity

```typescript
export class Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Category Entity

```typescript
export class Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cart Entity

```typescript
export class Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Entity

```typescript
export class Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: object;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  createdAt: Date;
}
```

### Review Entity

```typescript
export class Review {
  id: string;
  userId: string;
  productId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Security Requirements

### Authentication

- [x] JWT tokens (access token)
- [x] Password hashing (bcrypt)
- [x] Rate limiting (recommended)

### Authorization

- [x] Role-based access (customer, admin)
- [x] Resource ownership validation (cart, orders belong to user)

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization

### Error Handling

- [x] Consistent error responses (envelope format)
- [x] No stack traces in production
- [x] Security event logging

---

## Endpoints

### POST /api/v1/auth/register

**Description:** Register a new user

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "createdAt": "2026-01-04T10:00:00Z"
  }
}
```

### POST /api/v1/auth/login

**Description:** Login and get JWT token

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    }
  }
}
```

### GET /api/v1/products

**Description:** List products with filters and pagination

**Query params:** `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`, `sort`

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 99.99,
      "stock": 50,
      "category": { "id": "uuid", "name": "Electronics" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### POST /api/v1/cart/items

**Description:** Add item to cart

**Request:**

```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "cart-uuid",
    "items": [
      {
        "id": "item-uuid",
        "product": { "id": "uuid", "name": "Product", "price": 99.99 },
        "quantity": 2
      }
    ],
    "total": 199.98
  }
}
```

### POST /api/v1/orders

**Description:** Create order from cart

**Request:**

```json
{
  "shippingAddressId": "address-uuid"
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "order-uuid",
    "items": [...],
    "total": 199.98,
    "status": "pending",
    "createdAt": "2026-01-04T10:00:00Z"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "email must be a valid email" }
    ]
  }
}
```

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('ProductsService', () => {
  describe('create', () => {
    it('should create a product with valid data');
    it('should throw error when category not found');
  });

  describe('findAll', () => {
    it('should return paginated products');
    it('should filter by category');
    it('should search by name');
  });
});

describe('CreateOrderUseCase', () => {
  describe('execute', () => {
    it('should create order from cart');
    it('should reduce product stock');
    it('should clear cart after order');
    it('should throw error when insufficient stock');
  });
});
```

### E2E Tests

```typescript
describe('Products Endpoints', () => {
  describe('GET /api/v1/products', () => {
    it('should return paginated products');
    it('should filter products by category');
  });

  describe('POST /api/v1/products', () => {
    it('should create product as admin');
    it('should fail for non-admin users');
  });
});

describe('Cart Endpoints', () => {
  describe('POST /api/v1/cart/items', () => {
    it('should add item to cart');
    it('should update quantity if item exists');
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
  "@nestjs/config": "^3.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### TypeORM

```json
{
  "typeorm": "^0.3.0",
  "@nestjs/typeorm": "^10.0.0",
  "pg": "^8.11.0"
}
```

### Authentication

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.0",
  "bcrypt": "^5.1.0"
}
```

### Documentation

```json
{
  "@nestjs/swagger": "^7.0.0",
  "swagger-ui-express": "^5.0.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=admin
DATABASE_NAME=ecommerce_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=3600

# App
NODE_ENV=development
PORT=3000
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts` (implementation), `*.repository.interface.ts` (interface)
- DTOs: `*.dto.ts`
- Domain Entities: `*.entity.ts`
- ORM Entities: `*.orm-entity.ts`
- Use Cases: `*.use-case.ts`
- Mappers: `*.mapper.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for ecommerce-backend with intermediate clean architecture"
```

### 2. Domain Layer

```
"Implement Product domain entity and IProductRepository interface"
"Implement Order domain entity and IOrderRepository interface"
```

### 3. Application Layer

```
"Implement ProductsService with CRUD operations and filtering"
"Implement CreateOrderUseCase with stock validation and transaction handling"
```

### 4. Infrastructure Layer

```
"Implement ProductsController with Swagger documentation and response envelopes"
"Implement ProductRepository using TypeORM"
```

### 5. Testing

```
"Create unit tests for ProductsService with 80%+ coverage"
"Create E2E tests for products and orders endpoints"
```

---

## Learning Goals

Upon completing this project:

- [x] Understand Clean Architecture with NestJS modular approach
- [x] Implement repository pattern with TypeORM
- [x] Handle complex business logic with use cases
- [x] Implement JWT authentication with roles
- [x] Use TypeORM transactions for data integrity
- [x] Apply intermediate design patterns (Strategy, Builder, Facade)
- [x] Implement API versioning and response envelopes

---

## Next Steps

After completion:

1. Add payment integration (Stripe/PayPal)
2. Add image upload functionality
3. Add email notifications for orders

Then proceed to: **Task Management API** (Intermediate)

---

## Quick Reference

**Where does X go? (Modular + Clean Architecture)**

- Business logic → `src/{module}/application/services/` or `src/{module}/application/use-cases/`
- DTOs → `src/{module}/application/dto/`
- Database access → `src/{module}/infrastructure/persistence/`
- Endpoints → `src/{module}/infrastructure/controllers/`
- Domain entities → `src/{module}/domain/entities/`
- Repository interfaces → `src/{module}/domain/repositories/`

**TypeORM Commands:**

```bash
pnpm run typeorm migration:generate -- --name MigrationName
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

---

**Last updated:** 2026-01-04
**To use:** Run `claude code` from this project directory
