# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing 16 progressive NestJS backend practice projects organized by skill level (Beginner → Intermediate → Advanced → Expert). Each project is independent and follows Clean Architecture principles.

**Stack:** NestJS 10+ | TypeScript 5+ | PostgreSQL 17+ | Redis 7+ | Prisma/TypeORM/Drizzle (varies by project)

## Project Structure

```
projects/
├── beginner/       # User Auth, CRUD, Notes, Blog APIs
├── intermediate/   # E-commerce, Task Management, Chat, File Upload
├── advanced/       # Social Media, Payments, Notifications, Admin Dashboard
└── expert/         # Microservices, Streaming, Multi-tenant SaaS, Recommendations
```

## ORM by Project

| Level | Project | ORM |
|-------|---------|-----|
| Beginner | User Auth, CRUD, Notes | Prisma |
| Beginner | Blog | TypeORM |
| Intermediate | E-commerce | TypeORM |
| Intermediate | Task Management, File Upload | Prisma |
| Intermediate | Chat | Drizzle |
| Advanced | Social Media, Payments, Admin | TypeORM |
| Advanced | Notifications | Drizzle |
| Expert | Microservices | Mixed |
| Expert | Streaming, Recommendations | Drizzle |
| Expert | Multi-tenant SaaS | TypeORM |

## Common Commands

### Docker (shared services)
```bash
docker-compose up -d              # Start PostgreSQL, Redis, pgAdmin, MailHog
docker-compose down               # Stop services
docker-compose down -v            # Reset databases
docker-compose logs -f postgres   # View logs
```

### Per-project commands (run from project directory)
```bash
pnpm install                      # Install dependencies
pnpm run start:dev               # Development mode with watch
pnpm run build                   # Production build
pnpm run start                   # Production mode

# Testing
pnpm run test                    # Unit tests
pnpm run test:watch              # Watch mode
pnpm run test:cov                # Coverage report
pnpm run test:e2e                # E2E tests

# Database
pnpm run typeorm migration:generate -- --name MigrationName
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

## Architecture by Level

### Beginner (3 layers)
```
Controller → Service → Repository → Database
```
Patterns: Repository, Factory, Singleton, Decorator

### Intermediate (4 layers)
```
Controller → UseCase/Service → Domain → Repository
```
Patterns: + Strategy, Observer, Adapter, Builder, Facade

### Advanced (5+ layers with DDD)
```
Controller → Command/Query Handler → Domain (Aggregates, Value Objects) → Repository
```
Patterns: + CQRS, Domain Events, Mediator, State
**RFC 7807 Problem Details for errors is REQUIRED at this level**

### Expert (Distributed)
```
API Gateway → Services (CQRS + Event Sourcing) → Event Store
```
Patterns: + Event Sourcing, Saga, Circuit Breaker

## Folder Structure (per project)

```
src/
├── domain/           # Entities, repository interfaces, value objects
├── application/      # DTOs, services, use-cases, mappers
├── infrastructure/   # Controllers, persistence, guards, config
└── common/           # Decorators, filters, pipes, exceptions
```

## Key Conventions

### Naming
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`

### API Response Format (Intermediate+)
```typescript
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}
```

### Error Response (Advanced+ uses RFC 7807)
```typescript
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User with ID 'abc' not found.",
  "instance": "GET /api/v1/users/abc",
  "timestamp": "2026-01-02T10:00:00Z"
}
```

## Documentation Reference

- `GUIDE.md` - Full project descriptions and setup
- `ARCHITECTURE.md` - Detailed architecture patterns (17 design patterns with examples)
- `API_CONVENTIONS.md` - REST conventions by level, RFC 7807 implementation
- `DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md` - Real payment system example evolving through all levels
- `AI_CONTEXT.md` (per project) - Project-specific context for Claude Code

## Environment Variables

Each project uses `.env` (copy from `.env.example`):
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dev
DATABASE_PASSWORD=dev
DATABASE_NAME=practice_db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=900
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Testing Strategy

- **Beginner:** Unit tests for services (80%+ coverage)
- **Intermediate:** + Integration tests with mocked dependencies
- **Advanced:** + E2E tests with test database
- **Expert:** + Contract tests between services
