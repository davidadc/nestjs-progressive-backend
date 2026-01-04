# NestJS Progressive Backend - Monorepo Guide

**Last updated:** January 2026
**Main Stack:** NestJS + TypeScript + Clean Architecture
**Frontend:** React/Vite (simple) | Next.js (complex)

---

## Table of Contents

1. [Monorepo Structure](#monorepo-structure)
2. [Projects by Level](#projects-by-level)
3. [Tech Stack](#tech-stack)
4. [Architecture and Patterns](#architecture-and-patterns)
5. [Initial Setup](#initial-setup)
6. [Development Guide](#development-guide)
7. [Project Checklist](#project-checklist)

---

## Monorepo Structure

```
nestjs-progressive-backend/
├── projects/
│   ├── user-auth-api/                 # Beginner (Modular 3-Layer)
│   │   ├── src/
│   │   │   ├── auth/                  # Feature module
│   │   │   ├── users/                 # Feature module
│   │   │   ├── common/                # Shared utilities
│   │   │   ├── config/                # App configuration
│   │   │   └── app.module.ts
│   │   ├── prisma/
│   │   ├── test/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── crud-api/                      # Beginner
│   ├── notes-app/                     # Beginner
│   ├── blog-api/                      # Beginner
│   │
│   ├── ecommerce-backend/             # Intermediate
│   ├── task-management-api/           # Intermediate
│   ├── chat-app-backend/              # Intermediate
│   ├── file-upload-api/               # Intermediate
│   │
│   ├── social-media-backend/          # Advanced
│   ├── payment-integration-api/       # Advanced
│   ├── notification-system/           # Advanced
│   ├── admin-dashboard-api/           # Advanced
│   │
│   ├── microservices/                 # Expert
│   │   ├── user-service/
│   │   ├── product-service/
│   │   └── payment-service/
│   ├── streaming-backend/             # Expert
│   ├── saas-multi-tenant/             # Expert
│   └── recommendation-engine/         # Expert
│
├── docker-compose.yml                 # Shared services (DB, Redis, etc)
├── README.md                          # General index
└── .gitignore
```

**Advantages of this structure:**

- ✅ Each project is completely independent
- ✅ You can clone and run any project separately
- ✅ Different dependency versions if needed
- ✅ Easy to maintain and scale
- ✅ All share the same `docker-compose.yml` for DB and services

---

## Projects by Level

### ORM Strategy

Each project uses a specific ORM based on its requirements:

| ORM         | Projects                                              | Why                                                |
| ----------- | ----------------------------------------------------- | -------------------------------------------------- |
| **Prisma**  | User Auth, CRUD, Notes, Task Management, File Upload  | Great DX, type safety, rapid development           |
| **TypeORM** | Blog, E-commerce, Social Media, Payments, Admin, SaaS | Complex domains, DDD patterns, enterprise features |
| **Drizzle** | Chat, Notifications, Streaming, Recommendations       | Performance-critical, lightweight, SQL control     |

---

### BEGINNER LEVEL

#### 1. User Authentication API

**Description:** Basic authentication system with registration and login.
**ORM:** Prisma

**Technical Requirements:**

- JWT authentication
- Password hashing (bcrypt)
- Basic email validation
- Basic roles (user, admin)

**Folder structure:**

```
user-auth-api/
├── src/
│   ├── auth/                          # Auth feature module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/                         # Users feature module
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       └── user-response.dto.ts
│   ├── common/                        # Shared utilities
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── config/                        # App configuration
│   │   └── database.config.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── test/
│   ├── auth.service.spec.ts
│   └── auth.e2e-spec.ts
└── package.json
```

**Endpoints:**

- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/profile` - Get profile (protected)
- `POST /auth/logout` - Logout

**Security Considerations:**

- HTTPS required in production
- Rate limiting on authentication endpoints
- Minimum 8 character password
- JWT expiration (15 min access, 7 days refresh)

---

#### 2. Simple CRUD API

**Description:** Generic CRUD API for any entity (books, movies, etc).
**ORM:** Prisma

**Technical Requirements:**

- Complete CRUD operations
- Input validation
- Basic pagination
- Simple filters

**Endpoints:**

- `GET /items` - List with pagination
- `GET /items/:id` - Get one
- `POST /items` - Create
- `PUT /items/:id` - Full update
- `PATCH /items/:id` - Partial update
- `DELETE /items/:id` - Delete

**Stack:**

- Prisma for persistence
- Class-validator for DTOs
- PostgreSQL

---

#### 3. Notes App Backend

**Description:** Backend for notes application with user support.
**ORM:** Prisma

**Technical Requirements:**

- User - Notes relationship (1:N)
- Soft delete
- Timestamps (createdAt, updatedAt)
- Search by title/content

**Entities:**

- User (email, password)
- Note (title, content, userId, createdAt, updatedAt)

**Endpoints:**

- `POST /notes` - Create note
- `GET /notes` - List my notes
- `GET /notes/:id` - Get note
- `PUT /notes/:id` - Update
- `DELETE /notes/:id` - Delete
- `GET /notes/search?q=...` - Search

---

#### 4. Blog REST API

**Description:** Complete blog API with posts, comments, and categories.
**ORM:** TypeORM

**Technical Requirements:**

- Relationships: Author → Posts → Comments
- Categories for posts
- Timestamps
- Soft delete for posts

**Entities:**

```typescript
User { id, email, name, password, role: 'author' | 'reader' }
Post { id, title, content, excerpt, authorId, categoryId, published, createdAt }
Comment { id, content, postId, userId, createdAt }
Category { id, name, slug }
```

**Main Endpoints:**

- `GET /posts` - List published posts
- `POST /posts` - Create post (author)
- `GET /posts/:slug` - Get post with comments
- `POST /posts/:id/comments` - Add comment
- `GET /categories` - List categories

---

### INTERMEDIATE LEVEL

#### 5. E-commerce Backend

**Description:** Complete online store backend.
**ORM:** TypeORM

**Technical Requirements:**

- Authentication and authorization
- Shopping cart
- Inventory management
- Orders and statuses
- Complex relationships

**Entities:**

```typescript
User { id, email, password, role, addresses }
Product { id, name, price, stock, categoryId, images }
Category { id, name, slug }
Cart { id, userId, items: CartItem[] }
CartItem { id, cartId, productId, quantity }
Order { id, userId, items: OrderItem[], status, total, createdAt }
OrderItem { id, orderId, productId, quantity, priceAtTime }
Review { id, userId, productId, rating, comment }
```

**Endpoints:**

- `GET /products` - List with filters, search, pagination
- `POST /cart/items` - Add to cart
- `GET /cart` - View cart
- `DELETE /cart/items/:id` - Remove from cart
- `POST /orders` - Create order
- `GET /orders/:id` - View order details
- `POST /products/:id/reviews` - Leave review

**Considerations:**

- Transactions for orders
- Stock validation
- Price change auditing

---

#### 6. Task Management API

**Description:** Task management system with roles and permissions.
**ORM:** Prisma

**Technical Requirements:**

- Authentication and RBAC (Role-Based Access Control)
- Task statuses
- User assignment
- Granular permissions

**Entities:**

```typescript
User { id, email, name, role: 'admin' | 'manager' | 'user' }
Project { id, name, ownerId, members: User[] }
Task {
  id, projectId, title, description,
  assignedTo, status: 'todo' | 'in_progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  dueDate, createdBy
}
TaskComment { id, taskId, userId, content, createdAt }
```

**Endpoints:**

- `POST /projects` - Create project
- `POST /projects/:id/members` - Add member
- `POST /projects/:id/tasks` - Create task
- `PATCH /tasks/:id` - Update status
- `GET /tasks?assignedTo=me` - My tasks
- `POST /tasks/:id/comments` - Comment on task

**Permissions:**

- Project owner: full access
- Manager: create, assign, modify tasks
- User: view assigned, change status, comment

---

#### 7. Chat App Backend

**Description:** Chat backend with WebSocket and time-based queries.
**ORM:** Drizzle

**Technical Requirements:**

- WebSocket with Socket.io
- Real-time messaging
- Message history
- Online/offline users
- Notifications

**Entities:**

```typescript
User { id, email, name, avatar }
Conversation { id, participants: User[], createdAt }
Message { id, conversationId, senderId, content, createdAt }
```

**Features:**

- Real-time connection
- Message sending
- Paginated history
- Typing indicator
- Online/offline status
- New message notifications

**Considerations:**

- Use Redis for sessions
- Permission validation (only participants see messages)
- State synchronization

---

#### 8. File Upload API

**Description:** API for file upload and management.
**ORM:** Prisma

**Technical Requirements:**

- Multipart form-data handling
- File type validation
- Storage (local or cloud)
- Thumbnails for images
- Size limits

**Storage Options:**

- **Local:** `/uploads` with static middleware
- **Cloud:** AWS S3, Google Cloud Storage, or Azure Blob

**Entities:**

```typescript
User { id, email }
File {
  id, userId, originalName, storagePath,
  mimeType, size, uploadedAt, url
}
```

**Endpoints:**

- `POST /upload` - Upload file
- `GET /files` - List my files
- `GET /files/:id/download` - Download
- `DELETE /files/:id` - Delete
- `GET /files/:id/thumbnail` - Get thumbnail

**Considerations:**

- Validate MIME types
- Malware scan (optional: ClamAV)
- Storage limits per user
- CDN for serving files

---

### ADVANCED LEVEL

#### 9. Social Media Backend

**Description:** Social network backend with posts, likes, comments, and followers.
**ORM:** TypeORM

**Technical Requirements:**

- Complex relationships (followers, likes)
- Personalized feed
- Notifications
- User search
- Hashtags

**Entities:**

```typescript
User {
  id, email, name, avatar, bio,
  followers: User[], following: User[]
}
Post {
  id, authorId, content, images,
  createdAt, updatedAt
}
Like { id, userId, postId, type: 'post' | 'comment' }
Comment { id, postId, userId, content, createdAt }
Follow { id, followerId, followingId, createdAt }
Hashtag { id, tag, createdAt }
```

**Endpoints:**

- `GET /feed` - Personalized feed
- `POST /posts` - Create post
- `POST /posts/:id/like` - Like
- `GET /posts/:id/likes` - View likes
- `POST /posts/:id/comments` - Comment
- `POST /users/:id/follow` - Follow user
- `GET /users/:id/followers` - View followers
- `GET /users/search?q=...` - Search users

**Advanced Features:**

- Feed based on simple algorithm (recent posts from followed users)
- Personalized feed cache (Redis)
- Efficient pagination
- Denormalized counters (likes, comments)

---

#### 10. Payment Integration API

**Description:** Payment integration with Stripe or Paystack.
**ORM:** TypeORM

**Technical Requirements:**

- Payment provider integration
- Webhook handling
- Payment statuses
- Sensitive data validation
- Transaction auditing

**Flow:**

1. Client creates order
2. Backend creates payment session
3. Client pays on Stripe/Paystack
4. Webhook confirms payment
5. Update order status

**Entities:**

```typescript
Order {
  id, userId, items, total,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  paymentId
}
Payment {
  id, orderId, amount, currency,
  status, provider: 'stripe' | 'paystack',
  externalId, createdAt
}
Transaction {
  id, paymentId, amount, status,
  failureReason, timestamp
}
```

**Endpoints:**

- `POST /orders/:id/checkout` - Initiate payment
- `GET /orders/:id/payment-status` - View status
- `POST /webhook/payment` - Webhook (Stripe/Paystack)
- `GET /transactions` - Transaction history

**Security Considerations:**

- NEVER store card data
- Use PCI DSS Compliant
- Validate webhooks with signature
- Idempotency in operations
- Transaction logging

---

#### 11. Real-time Notification System

**Description:** Multi-platform real-time notification system.
**ORM:** Drizzle

**Technical Requirements:**

- WebSocket for notifications
- Email notifications
- SMS (optional)
- User preferences
- Notification history

**Entities:**

```typescript
User { id, email, notificationPreferences }
Notification {
  id, userId, type, title, message,
  data, read, createdAt
}
NotificationPreference {
  id, userId,
  email: boolean, push: boolean, sms: boolean
}
```

**Notification Types:**

- Order completed
- New comment
- New follower
- Liked post
- Mention in comment

**Channels:**

- Email (SendGrid)
- WebSocket (Socket.io)
- SMS (Twilio - optional)
- Push (Firebase Cloud Messaging - optional)

**Endpoints:**

- `GET /notifications` - History
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/preferences` - Update preferences

---

#### 12. Role-based Admin Dashboard API

**Description:** Backend for admin dashboard with analytics and management.
**ORM:** TypeORM

**Technical Requirements:**

- RBAC (Role-Based Access Control)
- Action auditing
- Reports and statistics
- User and content management

**Roles:**

- Super Admin: Full access
- Admin: User and content management
- Manager: Read-only reports
- Support: Limited management

**Endpoints:**

- `GET /admin/dashboard/stats` - General dashboard
- `GET /admin/users` - List users
- `PATCH /admin/users/:id/role` - Change role
- `DELETE /admin/users/:id` - Deactivate user
- `GET /admin/content` - Content moderation
- `PATCH /admin/content/:id/approve` - Approve
- `GET /admin/audit-log` - Audit logs
- `GET /admin/reports` - Reports

**Considerations:**

- Detailed logging of all actions
- Audit changes (who, what, when)
- Sensitive data masked in logs

---

### EXPERT LEVEL

#### 13. Microservices Architecture

**Description:** Microservices system with inter-service communication.
**ORM:** Mixed (Prisma for user-service, TypeORM for order-service, Drizzle for product-service)

**Services:**

```
user-service/
  - User management
  - Authentication
  - Profiles

product-service/
  - Product catalog
  - Categories
  - Inventory

payment-service/
  - Payment processing
  - Transactions
  - Refunds

order-service/
  - Order management
  - Statuses
  - Integration with other services
```

**Communication:**

- Synchronous: REST or gRPC
- Asynchronous: Message Queue (RabbitMQ, Apache Kafka)
- Service Discovery: Consul or similar

**Technical Requirements:**

- Docker and Docker Compose
- API Gateway
- Centralized logging (ELK, Datadog)
- Circuit breakers
- Retry logic

**Patterns:**

- Event sourcing
- CQRS (Command Query Responsibility Segregation)
- Saga pattern for distributed transactions
- Database per service

---

#### 14. Scalable Streaming Backend

**Description:** Real-time streaming system (chat, video, etc).
**ORM:** Drizzle

**Technical Requirements:**

- High-concurrency WebSocket
- Redis for pub/sub
- Adaptive bitrate streaming
- Load balancing
- CDN integration

**Considerations:**

- Data compression
- Heartbeat for disconnections
- Reconnection logic
- Buffer management

---

#### 15. Multi-tenant SaaS Backend

**Description:** Multi-tenant architecture with data isolation.
**ORM:** TypeORM

**Technical Requirements:**

- Data isolation per tenant
- Subdomains or slug-based tenants
- Billing and plans
- Subscription management

**Strategies:**

- Shared database + row-level security
- Database per tenant (more secure)
- Row-based multitenancy with middleware

**Entities:**

```typescript
Organization { id, name, slug, plan, maxUsers, maxStorage }
User { id, email, organizationId }
Tenant Context { organizationId, userId }
```

---

#### 16. AI-powered Recommendation Engine

**Description:** ML-based recommendation engine.
**ORM:** Drizzle

**Technical Requirements:**

- Integration with ML APIs (TensorFlow.js, Python ML service)
- Event tracking (views, clicks, purchases)
- Similarity calculation
- Recommendation caching

**Algorithms:**

- Collaborative filtering (similar users)
- Content-based (similar products)
- Hybrid approach

**Endpoints:**

- `GET /products/:id/recommendations` - Recommendations
- `POST /events/view` - Record view
- `GET /recommendations/for-me` - Personalized

---

## Tech Stack

### Backend Stack (All projects)

```json
{
  "core": {
    "runtime": "Node.js 20+",
    "language": "TypeScript 5+",
    "framework": "NestJS 10+"
  },
  "database": {
    "sql": "PostgreSQL 17+",
    "orm": "Prisma 5+ | TypeORM 0.3+ | Drizzle (varies by project)",
    "migration": "Prisma Migrate | TypeORM migrations | Drizzle Kit"
  },
  "api": {
    "validation": "class-validator",
    "serialization": "class-transformer",
    "documentation": "Swagger/OpenAPI"
  },
  "authentication": {
    "jwt": "@nestjs/jwt",
    "passport": "@nestjs/passport"
  },
  "realtime": {
    "websocket": "Socket.io"
  },
  "cache": {
    "redis": "ioredis"
  },
  "testing": {
    "unit": "Jest",
    "e2e": "Jest + Supertest"
  },
  "utilities": {
    "validation": "joi, yup",
    "date": "date-fns",
    "uuid": "uuid"
  }
}
```

### Frontend Stack

**Simple Projects (React + Vite):**

```json
{
  "framework": "React 18+",
  "builder": "Vite",
  "routing": "React Router v6",
  "state": "TanStack Query",
  "styling": "Tailwind CSS",
  "forms": "React Hook Form"
}
```

**Complex Projects (Next.js):**

```json
{
  "framework": "Next.js 14+ (App Router)",
  "api": "Route Handlers",
  "state": "TanStack Query + Zustand",
  "styling": "Tailwind CSS",
  "forms": "React Hook Form"
}
```

---

## Architecture and Patterns

### Architecture by Level

Architecture complexity increases progressively:

#### Beginner Level (3-Layer)

Simple layered architecture without domain separation:

```
Controller → Service → Repository → Database
```

```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepository.create({ ...dto, password: hashedPassword });
  }
}

// src/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }
}
```

#### Intermediate Level (4-Layer Clean Architecture)

Introduces domain layer with entity separation:

```
Controller → UseCase/Service → Domain (Entities) → Repository
```

#### Advanced/Expert Level (Full Clean Architecture + DDD)

Full separation with DDD patterns:

```
Controller → Command/Query Handler → Domain (Aggregates, Value Objects) → Repository
```

See ARCHITECTURE.md for detailed examples of each level.

### Applicable Patterns by Level

**Beginner:**

- Repository pattern
- Factory pattern
- Singleton pattern
- Decorator pattern

**Intermediate:**

- Strategy pattern
- Observer pattern
- Adapter pattern
- Builder pattern
- Facade pattern

**Advanced:**

- Mediator pattern
- State pattern
- Template Method pattern
- Domain Events
- Value Objects

**Expert:**

- CQRS pattern
- Event Sourcing
- Saga pattern
- Circuit Breaker
- API Gateway

---

## Initial Setup

### 1. Create the base structure

```bash
# Create root folder
mkdir nestjs-progressive-backend && cd nestjs-progressive-backend

# Create projects folder
mkdir projects

# Initialize git
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
```

### 2. docker-compose.yml (shared for all projects)

Create in the monorepo root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: practice_db
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U dev']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - '5050:80'
    depends_on:
      - postgres

  mailhog: # For email testing
    image: mailhog/mailhog:latest
    ports:
      - '1025:1025'
      - '8025:8025'

volumes:
  postgres_data:
```

Run:

```bash
docker-compose up -d
```

### 3. Create first project (User Auth API)

```bash
cd projects

# Create project with NestJS CLI
nest new user-auth-api --package-manager=pnpm --strict

cd user-auth-api
```

### 4. package.json template for each project

Each project should have a similar structure:

```json
{
  "name": "user-auth-api",
  "version": "1.0.0",
  "description": "User Authentication API",
  "author": "Your Name",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^12.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/typeorm": "^9.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "typeorm": "^0.3.16",
    "pg": "^8.10.0",
    "bcrypt": "^5.1.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^3.0.8",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "typescript": "^5.1.3"
  }
}
```

### 5. .env template for each project

Create `.env.example` in each project:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dev
DATABASE_PASSWORD=dev
DATABASE_NAME=practice_db

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=900  # 15 minutes in seconds

# Redis (if applicable)
REDIS_HOST=localhost
REDIS_PORT=6379

# App
NODE_ENV=development
PORT=3000
```

**Instructions for developers:**

```bash
# In each project
cp .env.example .env
# Edit .env with local values
```

### 6. Structure by level

All levels use **NestJS modular architecture** (feature modules). Complexity increases within modules.

**Beginner Level (Modular 3-Layer):**

```
project-name/
├── src/
│   ├── auth/                  # Feature module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   ├── users/                 # Feature module
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── common/                # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── pipes/
│   ├── config/                # App configuration
│   ├── app.module.ts
│   └── main.ts
├── prisma/                    # Prisma schema (if using Prisma)
│   └── schema.prisma
├── test/
├── .env.example
├── package.json
└── nest-cli.json
```

**Intermediate Level (Modular + Clean Architecture):**

```
project-name/
├── src/
│   ├── products/              # Feature module with Clean Arch
│   │   ├── products.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── repositories/  # Interfaces
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   ├── services/
│   │   │   └── use-cases/
│   │   └── infrastructure/
│   │       ├── controllers/
│   │       └── persistence/   # Repository implementations
│   ├── orders/                # Another feature module
│   │   ├── orders.module.ts
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── common/
│   ├── config/
│   ├── app.module.ts
│   └── main.ts
├── test/
└── package.json
```

**Advanced/Expert Level (Modular + Full DDD):**

```
project-name/
├── src/
│   ├── payments/              # Feature module with DDD
│   │   ├── payments.module.ts
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── repositories/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   ├── dto/
│   │   │   └── mappers/
│   │   └── infrastructure/
│   │       ├── controllers/
│   │       ├── persistence/
│   │       └── event-handlers/
│   ├── notifications/         # Another feature module
│   │   └── ...
│   ├── common/
│   ├── config/
│   ├── app.module.ts
│   └── main.ts
├── test/
└── package.json
```

---

## Development Guide

### Workflow per Project

#### Phase 1: Planning (Before coding)

- [ ] Identify main entities
- [ ] Map relationships
- [ ] Design input/output DTOs
- [ ] List required endpoints
- [ ] Document security requirements

#### Phase 2: Domain Layer

- [ ] Create entities
- [ ] Create repository interfaces
- [ ] Define domain events (if applicable)

#### Phase 3: Application Layer

- [ ] Create use cases
- [ ] Create DTOs
- [ ] Create mappers (Entity ↔ DTO)

#### Phase 4: Infrastructure Layer

- [ ] Implement repositories
- [ ] Create controllers
- [ ] Configure modules
- [ ] Create DB migrations

#### Phase 5: Testing

- [ ] Domain unit tests
- [ ] Use case tests
- [ ] Controller e2e tests

#### Phase 6: Documentation

- [ ] Swagger/OpenAPI
- [ ] README with instructions
- [ ] Request/response examples

### Code Conventions

**Naming:**

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Interfaces: `*.interface.ts`

**Folders (NestJS Modular):**

All levels use feature modules. Each module contains its related files:

```
src/
├── feature-a/        # Feature module (e.g., auth/, users/, products/)
│   ├── feature-a.module.ts
│   ├── feature-a.controller.ts
│   ├── feature-a.service.ts
│   ├── dto/
│   ├── entities/     # Or domain/ for intermediate+
│   └── ...
├── feature-b/        # Another feature module
├── common/           # Shared across modules
├── config/           # App-level configuration
└── app.module.ts
```

_Intermediate+ adds Clean Architecture layers inside each module:_

```
src/feature/
├── feature.module.ts
├── domain/           # Entities, repository interfaces
├── application/      # DTOs, services, use-cases
└── infrastructure/   # Controllers, persistence
```

### Testing Strategy

**Unit Tests (80% minimum coverage):**

```typescript
describe('RegisterUseCase', () => {
  it('should register a new user with valid email', async () => {
    // Arrange
    const mockUserRepository = jest.fn();
    const useCase = new RegisterUseCase(mockUserRepository, passwordService);

    // Act
    const result = await useCase.execute(validCommand);

    // Assert
    expect(result.email).toBe(validCommand.email);
  });
});
```

**E2E Tests:**

```typescript
describe('Auth Endpoints (e2e)', () => {
  it('POST /auth/register should create a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'pass123' })
      .expect(201);

    expect(res.body.email).toBe('test@test.com');
  });
});
```

---

## Claude Code Integration

### Recommended Workflow

Since each project is independent, you can use Claude Code in several ways:

#### Option 1: Code Review per Project

```bash
# Within each project
cd projects/user-auth-api
claude code
```

Then ask Claude:

- "Review the file src/domain/entities/user.entity.ts"
- "Implement src/application/use-cases/register.use-case.ts"
- "Create tests for auth.service.ts"

#### Option 2: Create Specialized Agents

Create an agent per project that knows:

- The specific project structure
- Applied patterns
- Technical requirements

```bash
# Create instructions in AI_CONTEXT.md file in each project
claude code --context AI_CONTEXT.md
```

**AI_CONTEXT.md content:**

```markdown
# User Auth API - Context for Claude Code

## Structure

- domain/: Entities (User)
- application/: UseCases (Register, Login)
- infrastructure/: Controllers, Repositories
- common/: Decorators, Guards, Pipes

## Patterns

- Clean Architecture
- Repository Pattern
- JWT Authentication
- Password Hashing (bcrypt)

## Requirements

- JWT Authentication
- Email validation
- Minimum 8 character password
- Rate limiting on login
- Soft delete on users (if applicable)

## Endpoints

- POST /auth/register
- POST /auth/login
- GET /auth/profile (protected)
- POST /auth/logout
```

#### Option 3: Batch Processing

To quickly create multiple projects:

```bash
cd projects

# Create base structure
for project in "crud-api" "notes-app" "blog-api"; do
  nest new $project --package-manager=pnpm --strict
  cd $project
  # Here Claude Code can apply templates
  cd ..
done
```

### Useful Prompts for Claude Code

**Create complete structure:**

```
Create the folder and file base structure for a NestJS project with Clean Architecture.
Include: domain/, application/, infrastructure/, common/
```

**Implement a module:**

```
Implement the authentication module with:
- Entity User
- UseCase Register
- DTO CreateUserDto
- Controller AuthController
- Repository UserRepository
```

**Add tests:**

```
Create unit tests for RegisterUseCase with 90% coverage.
Include: successful cases, duplicate email, invalid password.
```

**Generate migration:**

```
Create a TypeORM migration for the users table with fields:
id, email (unique), password (hashed), name, createdAt, updatedAt
```

---

## Project Checklist

### User Authentication API ✅

- [x] **Entities:** User entity with hashed password
- [x] **Endpoints:**
  - [x] POST /auth/register
  - [x] POST /auth/login
  - [x] GET /auth/profile
  - [x] POST /auth/logout
  - [x] POST /auth/refresh-token
- [x] **Validations:**
  - [x] Valid and unique email
  - [x] Minimum 8 character password
  - [x] Password and confirmation match
- [x] **Security:**
  - [x] JWT tokens with expiration
  - [x] Password hashing with bcrypt
  - [x] Rate limiting on login
  - [x] HTTPS enforced (docs)
- [x] **Testing:**
  - [x] Successful registration tests
  - [x] Duplicate email tests
  - [x] Invalid credentials login tests
  - [x] Token refresh tests
- [x] **Documentation:**
  - [x] Swagger/OpenAPI
  - [x] README with setup instructions
  - [x] Request examples

### Simple CRUD API ✅

- [x] **Entity:** Generic model (Book, Movie, etc)
- [x] **Endpoints:**
  - [x] GET /items (with pagination and filters)
  - [x] GET /items/:id
  - [x] POST /items
  - [x] PUT /items/:id
  - [x] PATCH /items/:id
  - [x] DELETE /items/:id
- [x] **Validations:**
  - [x] DTOs with required field validation
  - [x] Correct data types
- [x] **Testing:**
  - [x] Complete CRUD tests
  - [x] Pagination tests
  - [x] Not found (404) tests
- [x] **Documentation:**
  - [x] Swagger
  - [x] Usage examples

### Notes App Backend ✅

- [x] **Entities:** User and Note with relationships
- [x] **Endpoints:**
  - [x] Complete notes CRUD
  - [x] Search by title/content
  - [x] Soft delete
- [x] **Features:**
  - [x] Only view own notes
  - [x] Automatic timestamps
- [x] **Testing:** 100% service coverage (20 tests)

### Blog REST API ✅

- [x] **Entities:** User, Post, Comment, Category
- [x] **Endpoints:**
  - [x] Post CRUD
  - [x] Comment management
  - [x] List categories
  - [x] List posts by category
- [x] **Features:**
  - [x] Only authors can create posts
  - [x] Anyone can comment
  - [x] Soft delete for posts
- [x] **Testing:** 100% service coverage (43 unit + 26 E2E tests)

### E-commerce Backend ✅

- [x] **Entities:** User, Category, Product, Cart, CartItem, Order, OrderItem, Review, Address
- [x] **Endpoints:**
  - [x] Auth (register, login, profile, logout, refresh)
  - [x] Categories CRUD
  - [x] Products CRUD with filtering/search
  - [x] Cart management
  - [x] Order placement and history
  - [x] Reviews and ratings
  - [x] Address management
- [x] **Features:**
  - [x] Role-based access (Admin, Customer)
  - [x] Product search and filters
  - [x] Cart persistence
  - [x] Order status workflow
  - [x] Average rating calculation
- [x] **Testing:** Unit + E2E tests (80%+ coverage)

### Task Management API ✅ (Completed)

- [x] **Entities:** User, Project, Task, TaskComment
- [x] **Endpoints:**
  - [x] Auth (register, login)
  - [x] Projects CRUD + member management
  - [x] Tasks CRUD with filtering
  - [x] Task comments
- [x] **Features:**
  - [x] RBAC (Admin, Manager, User)
  - [x] Task status and priority
  - [x] Task assignment
  - [x] Project membership
- [x] **Testing:** Unit (39 tests) + E2E tests

---

## Useful Resources

### Documentation

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [JWT.io](https://jwt.io)

### Patterns

- [Clean Architecture in NestJS](https://docs.nestjs.com/first-steps)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

### Tools

- [Insomnia](https://insomnia.rest) or [Postman](https://www.postman.com) for API testing
- [DBeaver](https://dbeaver.io) for DB management
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Best Practices

- Keep layers separated
- One use case per responsibility
- Repositories to abstract DB
- DTOs for validation
- Tests before refactoring

---

## Next Steps

1. **Initial setup** of the monorepo
2. **Start with Beginner Level** (User Auth API)
3. **Use Claude Code** with this guide for code reviews
4. **Migrate to Intermediate** once you have 3 beginner projects
5. **Scale to Advanced** with better patterns and testing
6. **Culminate in Expert** with complex architectures

---

**Last updated:** 2026-01-03
**Suggested next review:** After completing Beginner Level
