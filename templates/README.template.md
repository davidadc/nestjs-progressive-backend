# {{PROJECT_NAME}}

{{BRIEF_DESCRIPTION}}

**Level:** {{LEVEL}}
**ORM:** {{ORM}}

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** {{ORM}}
- **Testing:** Jest + Supertest
<!-- Add project-specific tech -->

---

## Features

- [ ] {{FEATURE_1}}
- [ ] {{FEATURE_2}}
- [ ] {{FEATURE_3}}

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL/Redis)
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
cd projects/{{level}}/{{project-folder}}
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Setup Database

<!-- Prisma -->
```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

<!-- TypeORM -->
```bash
pnpm run typeorm migration:run
```

<!-- Drizzle -->
```bash
pnpm exec drizzle-kit migrate
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

<!-- Prisma -->
| Command | Description |
|---------|-------------|
| `pnpm exec prisma generate` | Generate Prisma client |
| `pnpm exec prisma migrate dev` | Run migrations (dev) |
| `pnpm exec prisma migrate deploy` | Run migrations (prod) |
| `pnpm exec prisma studio` | Open Prisma Studio |
| `pnpm exec prisma db seed` | Seed database |

<!-- TypeORM -->
| Command | Description |
|---------|-------------|
| `pnpm run typeorm migration:generate -- --name Name` | Generate migration |
| `pnpm run typeorm migration:run` | Run migrations |
| `pnpm run typeorm migration:revert` | Revert last migration |

<!-- Drizzle -->
| Command | Description |
|---------|-------------|
| `pnpm exec drizzle-kit generate` | Generate migrations |
| `pnpm exec drizzle-kit migrate` | Run migrations |
| `pnpm exec drizzle-kit studio` | Open Drizzle Studio |

---

## Project Structure

```
src/
├── domain/           # Entities, repository interfaces
├── application/      # DTOs, services, use-cases
├── infrastructure/   # Controllers, persistence, config
├── common/           # Shared utilities, decorators, pipes
├── app.module.ts
└── main.ts

test/
├── *.spec.ts         # Unit tests
└── *.e2e-spec.ts     # E2E tests

prisma/               # Prisma schema and migrations (if using Prisma)
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `{{METHOD}}` | `/{{resource}}` | {{description}} | {{Yes/No}} |

### Example Request

```bash
curl -X {{METHOD}} http://localhost:3000/{{resource}} \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

### Example Response

```json
{
  "field": "value"
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `dev` |
| `DATABASE_PASSWORD` | Database password | `dev` |
| `DATABASE_NAME` | Database name | `{{database_name}}` |
| `PORT` | Application port | `3000` |
<!-- Add project-specific variables -->

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
- **[Swagger UI](http://localhost:3000/api)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../API_CONVENTIONS.md)** - REST conventions

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] All endpoints implemented
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

<!-- Prisma -->
```bash
# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset
```

<!-- TypeORM -->
```bash
# Revert last migration
pnpm run typeorm migration:revert
```

---

## License

MIT

---

**Last updated:** {{DATE}}
