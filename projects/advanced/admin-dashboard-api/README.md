# Admin Dashboard API

Backend for admin dashboard with analytics, user management, content moderation, and comprehensive audit logging.

**Level:** Advanced
**ORM:** TypeORM

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** TypeORM
- **Architecture:** DDD + CQRS
- **Caching:** Redis
- **Auth:** JWT + Passport
- **Testing:** Jest + Supertest

---

## Features

- [x] JWT Authentication with role-based access
- [x] RBAC with 4 roles (super_admin, admin, manager, support)
- [x] User management (CRUD, role changes, deactivation)
- [x] Content moderation workflow (pending → approved/rejected)
- [x] Comprehensive audit logging
- [x] Dashboard analytics and statistics
- [x] Reports generation
- [x] RFC 7807 Problem Details error handling

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
cd projects/advanced/admin-dashboard-api
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
| `pnpm run typeorm migration:generate -- --name Name` | Generate migration |
| `pnpm run typeorm migration:run` | Run migrations |
| `pnpm run typeorm migration:revert` | Revert last migration |

---

## Project Structure

```
src/
├── auth/                 # Authentication module
├── users/                # User management module (DDD)
├── content/              # Content moderation module (DDD)
├── audit/                # Audit logging module
├── dashboard/            # Analytics & reports module
├── common/               # Shared utilities, base classes
│   ├── domain/           # AggregateRoot, ValueObject, DomainEvent
│   ├── decorators/       # @Roles, @CurrentUser
│   ├── filters/          # RFC 7807 Problem Details
│   └── exceptions/       # Problem Details factory
├── config/               # Configuration files
├── app.module.ts
└── main.ts

test/
├── *.spec.ts             # Unit tests
└── *.e2e-spec.ts         # E2E tests
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Admin login | No |
| POST | `/api/v1/auth/refresh` | Refresh token | Yes |

### Dashboard

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/v1/admin/dashboard/stats` | Dashboard statistics | Yes | All |

### User Management

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/v1/admin/users` | List users | Yes | All |
| GET | `/api/v1/admin/users/:id` | Get user details | Yes | All |
| POST | `/api/v1/admin/users` | Create user | Yes | Super Admin, Admin |
| PATCH | `/api/v1/admin/users/:id/role` | Change user role | Yes | Super Admin, Admin |
| DELETE | `/api/v1/admin/users/:id` | Deactivate user | Yes | Super Admin, Admin |

### Content Moderation

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/v1/admin/content` | List content | Yes | All |
| GET | `/api/v1/admin/content/:id` | Get content details | Yes | All |
| PATCH | `/api/v1/admin/content/:id/approve` | Approve content | Yes | Super Admin, Admin, Support |
| PATCH | `/api/v1/admin/content/:id/reject` | Reject content | Yes | Super Admin, Admin, Support |

### Audit & Reports

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/v1/admin/audit-log` | List audit logs | Yes | Super Admin, Admin, Manager |
| GET | `/api/v1/admin/reports` | Get reports | Yes | Super Admin, Admin, Manager |

### Example Request

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "SecurePass123!"}'

# Get dashboard stats (with token)
curl -X GET http://localhost:3000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer <token>"

# Change user role
curl -X PATCH http://localhost:3000/api/v1/admin/users/uuid/role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "manager"}'
```

### Example Response

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "manager"
  }
}
```

**Error (RFC 7807):**
```json
{
  "type": "https://api.example.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Cannot modify role of a super_admin user",
  "instance": "PATCH /api/v1/admin/users/uuid/role",
  "timestamp": "2026-01-12T10:00:00Z"
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
| `DATABASE_NAME` | Database name | `admin_dashboard_db` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | Token expiration (seconds) | `900` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | `604800` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | Application port | `3000` |

---

## RBAC Role Hierarchy

```
super_admin > admin > manager > support

| Action              | Super Admin | Admin | Manager | Support |
|---------------------|-------------|-------|---------|---------|
| View dashboard      | Yes         | Yes   | Yes     | Yes     |
| View users          | Yes         | Yes   | Yes     | Yes     |
| Create users        | Yes         | Yes   | No      | No      |
| Change user roles   | Yes         | Yes*  | No      | No      |
| Deactivate users    | Yes         | Yes*  | No      | No      |
| View content        | Yes         | Yes   | Yes     | Yes     |
| Moderate content    | Yes         | Yes   | No      | Yes     |
| View audit logs     | Yes         | Yes   | Yes     | No      |
| View reports        | Yes         | Yes   | Yes     | No      |

* Admin cannot modify super_admin users
```

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
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture patterns & decisions
- **[PROGRESS.md](./PROGRESS.md)** - Implementation progress tracking
- **[Swagger UI](http://localhost:3000/docs)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] All endpoints implemented
- [ ] RBAC implemented
- [ ] Audit logging working
- [ ] Input validation added
- [ ] RFC 7807 error handling implemented
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

**Last updated:** 2026-01-12
