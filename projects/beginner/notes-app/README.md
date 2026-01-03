# Notes App Backend

A beginner-level NestJS REST API for a personal notes application with user authentication, CRUD operations, soft delete, and search functionality.

**Level:** Beginner
**ORM:** Prisma

---

## Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5
- **Database:** PostgreSQL 17
- **ORM:** Prisma 7
- **Authentication:** JWT (Passport)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

---

## Features

- User registration and authentication (JWT)
- Complete CRUD operations for notes
- User-Note relationship (1:N) - users can only access their own notes
- Soft delete (notes are marked as deleted, not permanently removed)
- Search notes by title and content (case-insensitive)
- Pagination support
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
cd projects/beginner/notes-app
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

The API will be available at `http://localhost:3002`

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
├── auth/                     # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── users/                    # Users module
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       └── user-response.dto.ts
├── notes/                    # Notes feature module
│   ├── notes.module.ts
│   ├── notes.controller.ts
│   ├── notes.service.ts
│   ├── notes.repository.ts
│   ├── dto/
│   │   ├── create-note.dto.ts
│   │   ├── update-note.dto.ts
│   │   ├── find-notes.dto.ts
│   │   └── note-response.dto.ts
│   └── entities/
│       └── note.entity.ts
├── common/                   # Shared utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── dto/
│       ├── pagination.dto.ts
│       └── paginated-response.dto.ts
├── config/                   # Application configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── index.ts
├── prisma/                   # Database service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma

test/
├── auth.e2e-spec.ts
└── notes.e2e-spec.ts
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and get JWT token | No |
| `GET` | `/auth/profile` | Get current user profile | Yes |

### Notes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/notes` | Create a new note | Yes |
| `GET` | `/notes` | List my notes (paginated) | Yes |
| `GET` | `/notes/search` | Search notes by title/content | Yes |
| `GET` | `/notes/:id` | Get a specific note | Yes |
| `PUT` | `/notes/:id` | Update a note | Yes |
| `DELETE` | `/notes/:id` | Soft delete a note | Yes |

### Query Parameters

#### GET /notes

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number (min: 1) | `1` |
| `limit` | number | Notes per page (min: 1, max: 100) | `10` |

#### GET /notes/search

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `q` | string | Search term (searches title and content) | Yes |
| `page` | number | Page number | No |
| `limit` | number | Notes per page | No |

---

## Example Requests

### Register

```bash
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!", "name": "John Doe"}'
```

### Login

```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Create Note

```bash
curl -X POST http://localhost:3002/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"title": "My First Note", "content": "This is the content of my note."}'
```

### Search Notes

```bash
curl -X GET "http://localhost:3002/notes/search?q=important" \
  -H "Authorization: Bearer <your-token>"
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRATION` | Token expiration in seconds | `3600` |
| `PORT` | Application port | `3002` |
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
- `notes.service.ts`: 80%+
- `auth.service.ts`: 80%+

### Run E2E Tests

```bash
pnpm run test:e2e
```

---

## Documentation

- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - Context for Claude Code
- **[PROGRESS.md](./PROGRESS.md)** - Implementation progress
- **[Swagger UI](http://localhost:3002/docs)** - API documentation (when running)

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
- **Guard Pattern** - JWT authentication guards
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
# Find process using port 3002
lsof -i :3002

# Kill process or use different port
PORT=3003 pnpm run start:dev
```

### JWT Token Issues

```bash
# Make sure JWT_SECRET is set in .env
# Token expires after JWT_EXPIRATION seconds (default: 3600 = 1 hour)
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset
```

---

## Potential Improvements

Future enhancements that could be added to this project:

### Features
- Note categories/tags for better organization
- Note sharing between users (with permissions)
- Note archiving (separate from soft delete)
- Rich text content support (Markdown or HTML)
- Note pinning (pin important notes to top)
- Note templates for quick creation
- Bulk operations (delete multiple, move to category)

### Authentication & Security
- Refresh tokens for extended sessions
- Password reset via email
- Email verification on registration
- Rate limiting on authentication endpoints
- Account lockout after failed attempts

### Search & Filtering
- Full-text search with PostgreSQL
- Search highlighting in results
- Filter by date range
- Sort options (title, date created, date updated)
- Saved searches/filters

### Performance
- Redis caching for frequently accessed notes
- Database indexing optimization
- Response compression
- Pagination cursor-based (for large datasets)

### API Enhancements
- API versioning (v1, v2)
- Request/response logging
- Health check endpoint
- GraphQL alternative API
- WebSocket for real-time sync

### Testing
- E2E tests with Supertest
- Load/stress testing with k6 or Artillery
- Contract testing
- Integration tests with test database

### DevOps
- CI/CD pipeline (GitHub Actions)
- Docker containerization
- Kubernetes deployment manifests
- Monitoring with Prometheus/Grafana
- Centralized logging (ELK stack)

### User Experience
- Note export (PDF, Markdown, JSON)
- Note import from other services
- Trash/recycle bin with restore
- Note history/versions
- Collaborative editing

---

## License

MIT

---

**Last updated:** 2026-01-03
