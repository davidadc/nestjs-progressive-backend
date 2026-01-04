# Task Management API

Task management system with role-based access control (RBAC), project organization, task assignments, and commenting functionality. Built with NestJS following Clean Architecture principles.

**Level:** Intermediate
**ORM:** Prisma

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** Prisma
- **Authentication:** JWT + Passport
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

---

## Features

- [x] User authentication (register/login with JWT)
- [x] Role-based access control (Admin, Manager, User)
- [x] Project management with member system
- [x] Task CRUD with status and priority
- [x] Task assignment workflow
- [x] Task commenting system
- [x] Advanced filtering and pagination
- [x] API versioning (/api/v1/)
- [x] Rate limiting
- [x] Swagger documentation

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
cd projects/intermediate/task-management-api
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
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
Swagger docs at `http://localhost:3000/docs`

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

### Database Commands (Prisma)

| Command                           | Description            |
| --------------------------------- | ---------------------- |
| `pnpm exec prisma generate`       | Generate Prisma client |
| `pnpm exec prisma migrate dev`    | Run migrations (dev)   |
| `pnpm exec prisma migrate deploy` | Run migrations (prod)  |
| `pnpm exec prisma studio`         | Open Prisma Studio     |
| `pnpm exec prisma db seed`        | Seed database          |

---

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── application/      # DTOs, services
│   └── infrastructure/   # Controllers, guards, strategies
├── users/                # Users module
│   ├── domain/           # Entities, repository interfaces
│   ├── application/      # DTOs, services, mappers
│   └── infrastructure/   # Controllers, persistence
├── projects/             # Projects module
│   ├── domain/
│   ├── application/      # + use-cases
│   └── infrastructure/
├── tasks/                # Tasks module
│   ├── domain/           # + enums, events
│   ├── application/      # + use-cases
│   └── infrastructure/
├── comments/             # Comments module
├── common/               # Shared utilities
│   ├── decorators/
│   ├── dto/
│   ├── filters/
│   └── interceptors/
├── config/               # Configuration
├── prisma/               # Prisma module
├── app.module.ts
└── main.ts

prisma/
├── schema.prisma
└── migrations/

test/
└── *.e2e-spec.ts
```

---

## API Endpoints

### Authentication

| Method | Endpoint               | Description          | Auth |
|--------|------------------------|----------------------|------|
| POST   | `/api/v1/auth/register`| Register new user    | No   |
| POST   | `/api/v1/auth/login`   | Login and get JWT    | No   |

### Users

| Method | Endpoint           | Description           | Auth |
|--------|--------------------|-----------------------|------|
| GET    | `/api/v1/users/me` | Get current user      | Yes  |
| PATCH  | `/api/v1/users/me` | Update current user   | Yes  |

### Projects

| Method | Endpoint                              | Description      | Roles       |
|--------|---------------------------------------|------------------|-------------|
| POST   | `/api/v1/projects`                    | Create project   | Admin       |
| GET    | `/api/v1/projects`                    | List projects    | Any         |
| GET    | `/api/v1/projects/:id`                | Get project      | Member      |
| PATCH  | `/api/v1/projects/:id`                | Update project   | Owner       |
| DELETE | `/api/v1/projects/:id`                | Delete project   | Owner       |
| POST   | `/api/v1/projects/:id/members`        | Add member       | Owner       |
| DELETE | `/api/v1/projects/:id/members/:userId`| Remove member    | Owner       |

### Tasks

| Method | Endpoint                           | Description        | Roles                    |
|--------|------------------------------------|--------------------|--------------------------|
| POST   | `/api/v1/projects/:id/tasks`       | Create task        | Admin, Manager           |
| GET    | `/api/v1/tasks`                    | List tasks         | Any (filtered)           |
| GET    | `/api/v1/tasks/:id`                | Get task           | Member                   |
| PATCH  | `/api/v1/tasks/:id`                | Update task        | Admin, Manager, Assignee |
| PATCH  | `/api/v1/tasks/:id/status`         | Update status      | Admin, Manager, Assignee |
| DELETE | `/api/v1/tasks/:id`                | Delete task        | Admin, Manager           |
| POST   | `/api/v1/tasks/:id/comments`       | Add comment        | Member                   |
| GET    | `/api/v1/tasks/:id/comments`       | List comments      | Member                   |

### Query Parameters (Tasks)

```
GET /api/v1/tasks?status=in_progress&priority=high&assignedTo=me&page=1&limit=20
```

| Parameter   | Type   | Description                    |
|-------------|--------|--------------------------------|
| status      | string | todo, in_progress, done        |
| priority    | string | low, medium, high              |
| assignedTo  | string | 'me' or user UUID              |
| projectId   | string | Filter by project              |
| search      | string | Search title/description       |
| sort        | string | createdAt, dueDate, priority   |
| order       | string | asc, desc                      |
| page        | number | Page number (default: 1)       |
| limit       | number | Items per page (max: 100)      |

---

## Example Requests

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'
```

### Create Task

```bash
curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication",
    "priority": "high",
    "dueDate": "2026-01-15"
  }'
```

### Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "title": "Task title",
    "status": "todo",
    "priority": "high"
  },
  "meta": {
    "timestamp": "2026-01-04T10:00:00Z"
  }
}
```

---

## Environment Variables

| Variable            | Description              | Default                    |
| ------------------- | ------------------------ | -------------------------- |
| `DATABASE_URL`      | PostgreSQL connection    | See .env.example           |
| `JWT_SECRET`        | JWT signing secret       | (required)                 |
| `JWT_EXPIRATION`    | Token expiration (sec)   | `900`                      |
| `PORT`              | Application port         | `3000`                     |
| `NODE_ENV`          | Environment              | `development`              |
| `THROTTLE_TTL`      | Rate limit window (sec)  | `60`                       |
| `THROTTLE_LIMIT`    | Max requests per window  | `100`                      |

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

### API Integration Tests

```bash
# Seed test data
./scripts/seed-data.sh

# Run API tests
./scripts/test-api.sh
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

This project follows **4-Layer Clean Architecture**:

```
Controller Layer (HTTP, validation)
       ↓
Application Layer (Use Cases, Services, DTOs)
       ↓
Domain Layer (Entities, Repository Interfaces)
       ↓
Infrastructure Layer (Repositories, Database)
```

### Design Patterns Used

- **Repository Pattern** - Data access abstraction
- **Strategy Pattern** - Flexible task assignment
- **Observer Pattern** - Event-driven status updates
- **Use Case Pattern** - Business operation encapsulation
- **Mapper Pattern** - Entity/DTO transformation
- **Guard Pattern** - Authorization checks

---

## Roles & Permissions

| Role    | Projects           | Tasks                    | Comments |
|---------|--------------------|--------------------------|----------|
| Admin   | Create, full access| Full CRUD, assign        | Full     |
| Manager | View, participate  | Create, assign, update   | Full     |
| User    | View assigned      | Update own status        | Full     |

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] All endpoints implemented
- [ ] Input validation added
- [ ] RBAC implemented
- [ ] Error handling complete
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

# Use different port
PORT=3001 pnpm run start:dev
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset

# View migration status
pnpm exec prisma migrate status
```

---

## License

MIT

---

**Last updated:** 2026-01-04
