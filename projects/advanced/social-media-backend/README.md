# Social Media Backend

Social network backend with posts, likes, comments, followers, and personalized feed.

**Level:** Advanced
**ORM:** TypeORM

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** TypeORM
- **Cache:** Redis 7+
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI
- **Architecture:** DDD + CQRS

---

## Features

- [ ] User registration and authentication (JWT)
- [ ] User profiles with bio and avatar
- [ ] Follow/unfollow users
- [ ] Create, view, and delete posts
- [ ] Like/unlike posts and comments
- [ ] Comment on posts
- [ ] Hashtag support and extraction
- [ ] Personalized feed (posts from followed users)
- [ ] Trending posts and hashtags
- [ ] User search
- [ ] Real-time notifications (basic)
- [ ] Feed caching with Redis

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
cd projects/advanced/social-media-backend
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

### Database Commands (TypeORM)

| Command                                              | Description           |
| ---------------------------------------------------- | --------------------- |
| `pnpm run typeorm migration:generate -- --name Name` | Generate migration    |
| `pnpm run typeorm migration:run`                     | Run migrations        |
| `pnpm run typeorm migration:revert`                  | Revert last migration |

---

## Project Structure

```
src/
├── users/                    # Users module (DDD)
│   ├── domain/              # Aggregates, Value Objects, Events
│   ├── application/         # Commands, Queries, DTOs
│   └── infrastructure/      # Controllers, Repositories
├── posts/                    # Posts module (DDD)
├── comments/                 # Comments module
├── likes/                    # Likes module
├── feed/                     # Feed module
├── hashtags/                 # Hashtags module
├── notifications/            # Notifications module
├── auth/                     # Authentication module
├── common/                   # Shared utilities
│   ├── domain/              # Base classes (AggregateRoot, etc.)
│   ├── filters/             # RFC 7807 exception filter
│   └── exceptions/          # Problem Details factory
├── config/                   # Configuration
├── app.module.ts
└── main.ts

test/
├── *.spec.ts                 # Unit tests
└── *.e2e-spec.ts             # E2E tests
```

---

## API Endpoints

### Authentication

| Method | Endpoint              | Description   | Auth |
| ------ | --------------------- | ------------- | ---- |
| POST   | `/api/v1/auth/register` | Register    | No   |
| POST   | `/api/v1/auth/login`    | Login       | No   |
| POST   | `/api/v1/auth/refresh`  | Refresh     | Yes  |
| GET    | `/api/v1/auth/profile`  | Get profile | Yes  |

### Users

| Method | Endpoint                       | Description      | Auth |
| ------ | ------------------------------ | ---------------- | ---- |
| GET    | `/api/v1/users/:id`            | Get user profile | No   |
| GET    | `/api/v1/users/:id/followers`  | Get followers    | No   |
| GET    | `/api/v1/users/:id/following`  | Get following    | No   |
| POST   | `/api/v1/users/:id/follow`     | Follow user      | Yes  |
| DELETE | `/api/v1/users/:id/follow`     | Unfollow user    | Yes  |
| GET    | `/api/v1/users/search`         | Search users     | No   |

### Posts

| Method | Endpoint                       | Description     | Auth |
| ------ | ------------------------------ | --------------- | ---- |
| POST   | `/api/v1/posts`                | Create post     | Yes  |
| GET    | `/api/v1/posts/:id`            | Get post        | No   |
| DELETE | `/api/v1/posts/:id`            | Delete post     | Yes  |
| POST   | `/api/v1/posts/:id/like`       | Like post       | Yes  |
| DELETE | `/api/v1/posts/:id/like`       | Unlike post     | Yes  |
| GET    | `/api/v1/posts/:id/likes`      | Get likes       | No   |
| POST   | `/api/v1/posts/:id/comments`   | Add comment     | Yes  |
| GET    | `/api/v1/posts/:id/comments`   | Get comments    | No   |

### Feed

| Method | Endpoint              | Description       | Auth |
| ------ | --------------------- | ----------------- | ---- |
| GET    | `/api/v1/feed`        | Personalized feed | Yes  |
| GET    | `/api/v1/feed/trending` | Trending posts  | No   |

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "Hello world! #firstpost"}'
```

### Example Response (Success)

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Hello world! #firstpost",
    "hashtags": ["firstpost"],
    "likesCount": 0,
    "commentsCount": 0,
    "createdAt": "2026-01-05T10:00:00Z"
  }
}
```

### Example Response (Error - RFC 7807)

```json
{
  "type": "https://api.example.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Token has expired. Please refresh your authentication.",
  "instance": "POST /api/v1/posts",
  "timestamp": "2026-01-05T10:00:00Z",
  "traceId": "req-abc123"
}
```

---

## Environment Variables

| Variable              | Description         | Default           |
| --------------------- | ------------------- | ----------------- |
| `DATABASE_HOST`       | PostgreSQL host     | `localhost`       |
| `DATABASE_PORT`       | PostgreSQL port     | `5432`            |
| `DATABASE_USER`       | Database user       | `dev`             |
| `DATABASE_PASSWORD`   | Database password   | `dev`             |
| `DATABASE_NAME`       | Database name       | `social_media_db` |
| `JWT_SECRET`          | JWT signing secret  | -                 |
| `JWT_ACCESS_EXPIRATION`  | Access token TTL (seconds) | `900`    |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (seconds) | `604800` |
| `REDIS_HOST`          | Redis host          | `localhost`       |
| `REDIS_PORT`          | Redis port          | `6379`            |
| `PORT`                | Application port    | `3000`            |

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
- **[PROGRESS.md](./PROGRESS.md)** - Implementation progress
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
- [ ] RFC 7807 error handling
- [ ] Input validation added
- [ ] Unit tests written (80%+ coverage)
- [ ] E2E tests written
- [ ] Swagger documentation added
- [ ] Feed caching with Redis

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

### Redis Connection Failed

```bash
# Check Redis status
docker-compose logs redis

# Restart Redis
docker-compose restart redis
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
```

---

## License

MIT

---

**Last updated:** 2026-01-05
