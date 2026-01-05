# Chat App Backend

Real-time chat application with WebSocket support, conversation management, and user presence tracking.

**Level:** Intermediate
**ORM:** Drizzle

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** Drizzle
- **WebSocket:** Socket.io
- **Cache:** Redis 7+
- **Auth:** JWT + Passport
- **Testing:** Jest + Supertest

---

## Features

- [ ] User registration and authentication (JWT)
- [ ] Real-time messaging via WebSocket
- [ ] Conversation management (create, list, add participants)
- [ ] Message history with pagination
- [ ] User presence (online/offline/away)
- [ ] Typing indicators
- [ ] Rate limiting on auth endpoints
- [ ] Swagger API documentation

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
cd projects/intermediate/chat-app-backend
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Setup Database

```bash
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
```

### 5. Run Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

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

### Database Commands (Drizzle)

| Command                          | Description         |
| -------------------------------- | ------------------- |
| `pnpm exec drizzle-kit generate` | Generate migrations |
| `pnpm exec drizzle-kit migrate`  | Run migrations      |
| `pnpm exec drizzle-kit studio`   | Open Drizzle Studio |

---

## Project Structure

```
src/
├── users/                # User management module
├── conversations/        # Conversation management module
├── messages/             # Message handling module
├── chat/                 # WebSocket gateway module
├── auth/                 # Authentication module
├── common/               # Shared utilities, decorators, pipes
├── config/               # Configuration files
├── database/             # Drizzle schema and migrations
├── app.module.ts
└── main.ts

scripts/
├── seed-data.sh          # Database seeding script
└── test-api.sh           # API integration test script

test/
├── *.spec.ts             # Unit tests
└── *.e2e-spec.ts         # E2E tests
```

---

## API Endpoints

### Authentication

| Method | Endpoint              | Description       | Auth |
| ------ | --------------------- | ----------------- | ---- |
| POST   | `/api/v1/auth/register` | Register new user | No   |
| POST   | `/api/v1/auth/login`    | Login             | No   |

### Conversations

| Method | Endpoint                               | Description               | Auth |
| ------ | -------------------------------------- | ------------------------- | ---- |
| GET    | `/api/v1/conversations`                | List user conversations   | Yes  |
| POST   | `/api/v1/conversations`                | Create conversation       | Yes  |
| GET    | `/api/v1/conversations/:id`            | Get conversation details  | Yes  |
| GET    | `/api/v1/conversations/:id/messages`   | Get message history       | Yes  |
| POST   | `/api/v1/conversations/:id/messages`   | Send message (HTTP)       | Yes  |
| POST   | `/api/v1/conversations/:id/participants` | Add participant         | Yes  |

### Users

| Method | Endpoint              | Description       | Auth |
| ------ | --------------------- | ----------------- | ---- |
| GET    | `/api/v1/users/online`  | Get online users  | Yes  |

### WebSocket Events

**Client → Server:**
- `conversation:join` - Join conversation room
- `conversation:leave` - Leave conversation
- `message:send` - Send a message
- `typing:start` - Started typing
- `typing:stop` - Stopped typing
- `presence:update` - Update presence status

**Server → Client:**
- `message:received` - New message
- `typing:update` - Typing indicator
- `user:online` - User came online
- `user:offline` - User went offline
- `participant:added` - New participant
- `error` - Error notification

### Example Request

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John", "password": "password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Create conversation (with token)
curl -X POST http://localhost:3000/api/v1/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"participantIds": ["user-uuid-2"]}'
```

### Example Response

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "conv-uuid",
    "participants": [
      { "id": "user-1", "name": "John" },
      { "id": "user-2", "name": "Jane" }
    ]
  }
}
```

---

## Environment Variables

| Variable            | Description           | Default       |
| ------------------- | --------------------- | ------------- |
| `DATABASE_HOST`     | PostgreSQL host       | `localhost`   |
| `DATABASE_PORT`     | PostgreSQL port       | `5432`        |
| `DATABASE_USER`     | Database user         | `admin`       |
| `DATABASE_PASSWORD` | Database password     | `admin`       |
| `DATABASE_NAME`     | Database name         | `chat_db`     |
| `JWT_SECRET`        | JWT secret key        | -             |
| `JWT_EXPIRATION`    | Token expiration (s)  | `3600`        |
| `REDIS_HOST`        | Redis host            | `localhost`   |
| `REDIS_PORT`        | Redis port            | `6379`        |
| `PORT`              | Application port      | `3000`        |

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
- **[Swagger UI](http://localhost:3000/api)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] All REST endpoints implemented
- [ ] WebSocket gateway implemented
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

### Redis Connection Failed

```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process or use different port
PORT=3001 pnpm run start:dev
```

### WebSocket Connection Issues

```bash
# Check if the server is running
curl http://localhost:3000/health

# Verify CORS settings if connecting from browser
```

### Migration Issues

```bash
# Drop and recreate (WARNING: deletes all data)
pnpm exec drizzle-kit drop
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
```

---

## License

MIT

---

**Last updated:** 2026-01-05
