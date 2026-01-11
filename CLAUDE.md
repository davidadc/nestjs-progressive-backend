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
docker-compose up -d              # Start PostgreSQL, Redis, pgAdmin, MailHog, Redis Commander
docker-compose down               # Stop services
docker-compose down -v            # Reset databases
docker-compose logs -f postgres   # View logs
```

**Service URLs:**
- pgAdmin: http://localhost:5050 (admin@example.com / admin)
- MailHog: http://localhost:8025
- Redis Commander: http://localhost:8081

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

### docs/ folder
- `docs/GUIDE.md` - Full project descriptions and setup
- `docs/ARCHITECTURE.md` - Detailed architecture patterns (17 design patterns with examples)
- `docs/API_CONVENTIONS.md` - REST conventions by level, RFC 7807 implementation
- `docs/DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md` - Real payment system example evolving through all levels
- `docs/DOCUMENTATION_INDEX.md` - Quick navigation index for all documentation

### templates/ folder
- `templates/AI_CONTEXT.template.md` - Template for creating per-project AI context files
- `templates/README.template.md` - Template for per-project README files
- `templates/PROGRESS.template.md` - Template for tracking implementation progress and planification
- `templates/ARCHITECTURE.template.md` - Template for per-project architecture documentation

### Per-project files
- `AI_CONTEXT.md` (per project) - Project-specific context for Claude Code
- `PROGRESS.md` (per project) - Implementation checklist and progress tracking
- `ARCHITECTURE.md` (per project) - Project-specific architecture decisions and patterns

## Recommended Path for Starting a New Project

When the user wants to start a new project, follow this documentation path:

### Step 1: Project Selection (docs/GUIDE.md)
- Review available projects by level (Beginner → Expert)
- Each project includes: description, ORM, entities, endpoints, requirements
- Help user choose based on their experience level

### Step 2: Architecture (docs/ARCHITECTURE.md)
Consult the section matching the project level:
| Level | Architecture | Key Patterns |
|-------|-------------|--------------|
| Beginner | 3-Layer (Controller → Service → Repository) | Repository, Factory, Decorator |
| Intermediate | 4-Layer Clean Architecture | + Strategy, Observer, Adapter, Builder |
| Advanced | 5+ Layer DDD + CQRS | + Mediator, State, Domain Events |
| Expert | Distributed + Event Sourcing | + Saga, Circuit Breaker |

### Step 3: API Conventions (docs/API_CONVENTIONS.md)
Consult the section matching the project level:
- **Beginner:** Basic REST (URLs, pagination, simple errors)
- **Intermediate:** + Versioning, rate limiting, Swagger, response envelopes
- **Advanced:** RFC 7807 Problem Details (MANDATORY)
- **Expert:** + Webhooks, async operations, distributed tracing

### Step 4: Real Examples (docs/DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md)
- Shows a Payment System evolving from Beginner to Expert
- Demonstrates when and why to introduce each pattern
- Reference working code for implementation guidance

### Step 5: Project Setup
Copy templates to the project folder:
```bash
cp templates/AI_CONTEXT.template.md projects/{level}/{project}/AI_CONTEXT.md
cp templates/README.template.md projects/{level}/{project}/README.md
cp templates/PROGRESS.template.md projects/{level}/{project}/PROGRESS.md
cp templates/ARCHITECTURE.template.md projects/{level}/{project}/ARCHITECTURE.md
```
Then customize all `{{PLACEHOLDER}}` values.

**PROGRESS.md Purpose:**
- Serves as implementation planification before starting
- Tracks completion status of each phase
- Documents endpoints, entities, and folder structure
- Must be reviewed and approved by user before implementation begins

**ARCHITECTURE.md Purpose:**
- Documents the specific architecture patterns for this project level
- Defines folder structure, layer responsibilities, and design patterns
- Provides implementation checklists and code examples
- Tracks architectural compliance during development

### Step 6: Implementation Workflow
Follow the phases from the project's `AI_CONTEXT.md`:
1. **Setup:** Folder structure, database config
2. **Domain:** Entities, repository interfaces
3. **Application:** DTOs, services, use-cases
4. **Infrastructure:** Controllers, repositories
5. **Testing:** Unit (80%+), E2E
6. **Documentation:** Swagger

### Quick Decision Guide

**"What document should I check?"**
- Project overview/selection → `docs/GUIDE.md`
- Patterns for my level → `docs/ARCHITECTURE.md`
- Endpoint design → `docs/API_CONVENTIONS.md`
- Code examples → `docs/DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md`
- Navigate docs → `docs/DOCUMENTATION_INDEX.md`
- Templates → `templates/` folder
- Project-specific architecture → `{project}/ARCHITECTURE.md`

**"When must I use RFC 7807?"**
- Advanced and Expert levels (MANDATORY)

**"What files must I create for a new project?"**
1. `AI_CONTEXT.md` - AI assistant context (from template)
2. `README.md` - Project documentation (from template)
3. `PROGRESS.md` - Implementation tracking (from template)
4. `ARCHITECTURE.md` - Architecture decisions (from template)

## Environment Variables

Each project uses `.env` (copy from `.env.example`):
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=admin
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
