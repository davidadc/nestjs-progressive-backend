# {{PROJECT_NAME}} - Implementation Progress

**Project:** {{project-folder}}
**Level:** {{Beginner | Intermediate | Advanced | Expert}}
**ORM:** {{Prisma | TypeORM | Drizzle}}
**Architecture:** {{3-Layer | 4-Layer Clean | 5-Layer DDD | Distributed}}

---

## Project Overview

**Description:** {{Brief description of what this project does}}

**Technical Requirements:**

- {{Requirement 1}}
- {{Requirement 2}}
- {{Requirement 3}}

---

## Implementation Status

### Phase 1: Project Scaffolding

- [ ] Initialize NestJS project with CLI
- [ ] Install core dependencies
- [ ] Install validation dependencies (class-validator, class-transformer)
- [ ] Install documentation (@nestjs/swagger)
- [ ] Create .env and .env.example files
- [ ] Set up folder structure

### Phase 2: Database Setup

<!-- For Prisma -->

- [ ] Initialize Prisma
- [ ] Define models in schema.prisma
- [ ] Run initial migration
- [ ] Generate Prisma client

<!-- For TypeORM -->

- [ ] Configure TypeORM module
- [ ] Create entities
- [ ] Generate initial migration
- [ ] Run migrations

<!-- For Drizzle -->

- [ ] Configure Drizzle
- [ ] Define schema
- [ ] Run migrations

### Phase 3: Domain Layer

- [ ] Create entity type definitions
- [ ] Create repository interfaces (if using Repository pattern)
- [ ] Define value objects (Advanced+)
- [ ] Define domain events (Advanced+)

### Phase 4: Application Layer

- [ ] Create DTOs with validation
- [ ] Create response DTOs
- [ ] Create service(s) with business logic
- [ ] Create use-cases (Intermediate+)
- [ ] Create mappers (entity <-> DTO)

### Phase 5: Infrastructure Layer

- [ ] Create repository implementations
- [ ] Create controller(s) with Swagger docs
- [ ] Create guards (if needed)
- [ ] Create interceptors (if needed)
- [ ] Create filters (if needed)

### Phase 6: Common Module

- [ ] Create custom decorators
- [ ] Create pipes
- [ ] Create exception filters

### Phase 7: Configuration

- [ ] Create configuration files
- [ ] Wire up ConfigModule
- [ ] Set up environment validation

### Phase 8: App Module Integration

- [ ] Update AppModule with all imports
- [ ] Configure main.ts with:
  - [ ] Swagger documentation
  - [ ] ValidationPipe
  - [ ] CORS (if needed)

### Phase 9: API Integration Testing (Scripts)

> Quick validation of endpoints using shell scripts before formal testing.

- [ ] Create `scripts/` directory
- [ ] Create `seed-data.sh` for test data population
  - [ ] Seed reference data (categories, roles, etc.)
  - [ ] Seed sample entities for testing
  - [ ] Add cleanup/reset function
- [ ] Create `test-api.sh` for endpoint testing
  - [ ] Health check verification
  - [ ] Auth endpoints (if applicable)
  - [ ] CRUD endpoints for each resource
  - [ ] Error handling (404, 401, 403, validation errors)
  - [ ] Test summary with pass/fail counters
- [ ] Make scripts executable (`chmod +x`)

**Usage:**
```bash
# Seed test data
./scripts/seed-data.sh

# Run API tests
./scripts/test-api.sh
```

### Phase 10: Unit & E2E Testing

- [ ] Create unit tests for services
- [ ] Create unit tests for use-cases (if applicable)
- [ ] Create E2E tests with Jest/Supertest
- [ ] Achieve 80%+ coverage on core logic

### Phase 11: Documentation

- [ ] Swagger API documentation complete
- [ ] PROGRESS.md updated (this file)
- [ ] AI_CONTEXT.md created
- [ ] README.md updated

---

## Endpoints

| Method     | Endpoint    | Description     | Auth Required |
| ---------- | ----------- | --------------- | ------------- |
| {{METHOD}} | `{{/path}}` | {{Description}} | {{Yes/No}}    |

---

## Entities / Models

```typescript
// {{EntityName}}
{
  id: string;
  // ... fields
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Folder Structure

```
{{project-folder}}/
├── src/
│   ├── {{module}}/
│   │   ├── {{module}}.module.ts
│   │   ├── {{module}}.controller.ts
│   │   ├── {{module}}.service.ts
│   │   ├── {{module}}.repository.ts
│   │   ├── dto/
│   │   │   ├── create-{{entity}}.dto.ts
│   │   │   └── {{entity}}-response.dto.ts
│   │   └── entities/
│   │       └── {{entity}}.entity.ts
│   ├── common/
│   ├── config/
│   ├── prisma/ (or typeorm/ or drizzle/)
│   ├── app.module.ts
│   └── main.ts
├── scripts/
│   ├── seed-data.sh          # Database seeding script
│   └── test-api.sh           # API integration test script
├── prisma/ (or migrations/)
├── test/
└── package.json
```

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (from monorepo root)
docker-compose up -d postgres

# Run migrations
{{pnpm exec prisma migrate dev | pnpm run migration:run | pnpm run db:migrate}}

# Start development server
pnpm run start:dev

# Access Swagger docs
open http://localhost:3000/docs

# Seed test data (optional, in new terminal)
./scripts/seed-data.sh

# Run API integration tests
./scripts/test-api.sh
```

---

## Test Coverage

```
{{service}}.ts    | {{X}}% statements | {{X}}% functions
```

---

## Design Decisions

<!-- Document any important architectural or technical decisions -->

1. **{{Decision Title}}:** {{Explanation}}

---

## Known Issues / TODOs

- [ ] {{Issue or future improvement}}

---

**Started:** {{YYYY-MM-DD}}
**Completed:** {{YYYY-MM-DD or "In Progress"}}
**Next Steps:** {{What to do after completion}}
