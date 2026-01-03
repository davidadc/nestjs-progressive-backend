# Simple CRUD API

A beginner-level NestJS REST API demonstrating complete CRUD operations with pagination, filtering, and sorting.

**Level:** Beginner
**ORM:** Prisma

---

## Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5
- **Database:** PostgreSQL 17
- **ORM:** Prisma 7 (with `@prisma/adapter-pg`)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

---

## Features

- Complete CRUD operations (Create, Read, Update, Delete)
- Input validation with class-validator
- Pagination (page, limit)
- Search filtering (name and description)
- Category filtering
- Sorting (name, price, createdAt)
- Active/inactive status filtering
- Swagger API documentation

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
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd projects/beginner/crud-api
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings (defaults should work)
```

### 4. Setup Database

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### 5. Run Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run start:dev` | Start in development mode (watch) |
| `pnpm run start` | Start in production mode |
| `pnpm run build` | Build for production |
| `pnpm run test` | Run unit tests |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run test:cov` | Run tests with coverage |
| `pnpm run test:e2e` | Run E2E tests |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format with Prettier |

### Database Commands

| Command | Description |
|---------|-------------|
| `pnpm exec prisma generate` | Generate Prisma client |
| `pnpm exec prisma migrate dev` | Run migrations (dev) |
| `pnpm exec prisma migrate deploy` | Run migrations (prod) |
| `pnpm exec prisma studio` | Open Prisma Studio |

---

## Project Structure

```
src/
├── items/                    # Items feature module
│   ├── items.module.ts
│   ├── items.controller.ts
│   ├── items.service.ts
│   ├── items.repository.ts
│   ├── items.repository.interface.ts
│   ├── dto/
│   │   ├── create-item.dto.ts
│   │   ├── update-item.dto.ts
│   │   ├── find-items.dto.ts
│   │   └── item-response.dto.ts
│   └── entities/
│       └── item.entity.ts
├── common/                   # Shared utilities
│   └── dto/
│       ├── pagination.dto.ts
│       └── paginated-response.dto.ts
├── config/                   # Application configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   └── index.ts
├── prisma/                   # Database service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma

test/
└── items.e2e-spec.ts
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/items` | List items with pagination and filters | No |
| `GET` | `/items/:id` | Get single item by UUID | No |
| `POST` | `/items` | Create new item | No |
| `PUT` | `/items/:id` | Full update of item | No |
| `PATCH` | `/items/:id` | Partial update of item | No |
| `DELETE` | `/items/:id` | Delete item | No |

### Query Parameters for GET /items

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (min: 1) | `1` |
| `limit` | number | Items per page (min: 1, max: 100) | `10` |
| `search` | string | Search in name and description | `book` |
| `category` | string | Filter by category | `electronics` |
| `sort` | string | Sort field: name, price, createdAt | `price` |
| `order` | string | Sort order: asc, desc | `asc` |
| `isActive` | boolean | Filter by active status | `true` |

### Example Request

```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "New Item", "price": 29.99, "category": "electronics"}'
```

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "New Item",
  "description": null,
  "price": 29.99,
  "quantity": 0,
  "category": "electronics",
  "isActive": true,
  "createdAt": "2026-01-03T10:00:00.000Z",
  "updatedAt": "2026-01-03T10:00:00.000Z"
}
```

### Paginated Response

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

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

Coverage targets:
- `items.service.ts`: 100%
- `items.repository.ts`: 94%

### Run E2E Tests

```bash
pnpm run test:e2e
```

---

## Documentation

- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - Context for Claude Code
- **[PROGRESS.md](./PROGRESS.md)** - Implementation progress
- **[Swagger UI](http://localhost:3000/docs)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions

---

## Architecture

This project follows a **3-Layer Architecture**:

```
Controller → Service → Repository → Database
```

**Patterns Used:**
- **Repository Pattern** - Abstracts database operations
- **DTO Pattern** - Separates API contracts from entities
- **Dependency Injection** - NestJS built-in DI

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
# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset
```

---

## Potential Improvements

Future enhancements that could be added to this project:

### Authentication & Authorization
- Add JWT authentication
- Implement role-based access control (RBAC)
- Protect create/update/delete endpoints

### Features
- Soft delete (archive items instead of permanent deletion)
- Bulk operations (create/update/delete multiple items)
- Image upload for items
- Tags/labels support
- Item versioning/history

### Performance
- Redis caching for frequently accessed items
- Database indexing optimization
- Response compression

### API Enhancements
- API versioning (v1, v2)
- Rate limiting
- Request/response logging
- Health check endpoint
- GraphQL alternative

### Testing
- Load/stress testing with k6 or Artillery
- Contract testing
- Mutation testing

### DevOps
- CI/CD pipeline (GitHub Actions)
- Docker containerization
- Kubernetes deployment manifests
- Monitoring with Prometheus/Grafana

---

## License

MIT

---

**Last updated:** 2026-01-03
