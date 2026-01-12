# Real-time Notification System

Multi-platform real-time notification system with WebSocket, email, SMS, and push notification support. Built with NestJS following DDD and CQRS patterns.

**Level:** Advanced
**ORM:** Drizzle

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** Drizzle
- **Real-time:** Socket.io
- **Cache/PubSub:** Redis 7+
- **Email:** SendGrid
- **SMS:** Twilio (optional)
- **Push:** Firebase Cloud Messaging (optional)
- **Testing:** Jest + Supertest
- **Architecture:** DDD + CQRS

---

## Features

- [ ] Real-time notifications via WebSocket
- [ ] Email notifications via SendGrid
- [ ] SMS notifications via Twilio (optional)
- [ ] Push notifications via FCM (optional)
- [ ] User notification preferences
- [ ] Mark notifications as read (single/bulk)
- [ ] Notification history with pagination
- [ ] Filter by type and read status
- [ ] Per-notification-type channel preferences
- [ ] RFC 7807 Problem Details error handling

---

## Notification Types

| Type | Description | Default Channels |
|------|-------------|------------------|
| `order_completed` | Order payment confirmed | Email, Push |
| `new_comment` | Someone commented on your post | Push, WebSocket |
| `new_follower` | New user followed you | Push, WebSocket |
| `liked_post` | Someone liked your post | WebSocket |
| `mention` | Mentioned in a comment | Email, Push, WebSocket |

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL/Redis)
- pnpm (recommended) or npm/yarn
- SendGrid API key (for email notifications)
- Twilio credentials (optional, for SMS)
- Firebase credentials (optional, for push notifications)

---

## Getting Started

### 1. Start Docker Services

From the monorepo root:

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd projects/advanced/notification-system
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings (especially API keys)
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
Swagger documentation at `http://localhost:3000/docs`

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
notification-system/
├── src/
│   ├── notifications/           # Main notification module (DDD)
│   │   ├── domain/              # Aggregates, Value Objects, Events
│   │   ├── application/         # Commands, Queries, DTOs
│   │   └── infrastructure/      # Controllers, Repositories, Gateway
│   ├── preferences/             # User notification preferences
│   ├── channels/                # Notification delivery channels
│   │   └── infrastructure/
│   │       ├── email/           # SendGrid adapter
│   │       ├── websocket/       # Socket.io
│   │       ├── sms/             # Twilio adapter
│   │       └── push/            # FCM adapter
│   ├── users/                   # User management
│   ├── auth/                    # JWT authentication
│   ├── common/                  # Shared utilities, RFC 7807
│   ├── config/                  # Configuration
│   ├── app.module.ts
│   └── main.ts
├── drizzle/                     # Drizzle schema and migrations
├── scripts/                     # Utility scripts
├── test/                        # E2E tests
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
| ------ | -------- | ----------- | ---- |
| `GET` | `/api/v1/notifications` | Get notification history | Yes |
| `GET` | `/api/v1/notifications/unread-count` | Get unread count | Yes |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark as read | Yes |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all as read | Yes |
| `GET` | `/api/v1/notifications/preferences` | Get preferences | Yes |
| `PATCH` | `/api/v1/notifications/preferences` | Update preferences | Yes |

### Example Request

```bash
# Get notifications with pagination and filters
curl -X GET "http://localhost:3000/api/v1/notifications?page=1&limit=20&read=false" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Example Response

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "type": "new_comment",
      "title": "New comment on your post",
      "message": "John Doe commented: \"Great article!\"",
      "data": { "postId": "post-123", "commentId": "comment-456" },
      "read": false,
      "readAt": null,
      "createdAt": "2026-01-11T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Error Response (RFC 7807)

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Notification with ID 'abc' not found.",
  "instance": "PATCH /api/v1/notifications/abc/read",
  "timestamp": "2026-01-11T10:00:00Z",
  "traceId": "req-12345"
}
```

---

## WebSocket Events

Connect to `ws://localhost:3000` with Socket.io client.

### Client to Server

```javascript
// Authenticate connection
socket.emit('subscribe', { token: 'jwt-token' });

// Mark notification as read
socket.emit('mark_read', { notificationId: 'notification-id' });
```

### Server to Client

```javascript
// New notification received
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Notification marked as read
socket.on('notification_read', (data) => {
  console.log('Marked as read:', data.id);
});

// Updated unread count
socket.on('unread_count', (data) => {
  console.log('Unread count:', data.count);
});
```

---

## Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `dev` |
| `DATABASE_PASSWORD` | Database password | `dev` |
| `DATABASE_NAME` | Database name | `notification_db` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT expiration (seconds) | `900` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `SENDGRID_API_KEY` | SendGrid API key | - |
| `SENDGRID_FROM_EMAIL` | Sender email address | - |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | - |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - |
| `TWILIO_FROM_NUMBER` | Twilio phone number | - |
| `PORT` | Application port | `3000` |

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
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture patterns
- **[Swagger UI](http://localhost:3000/docs)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions (RFC 7807)

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] All endpoints implemented
- [ ] WebSocket gateway working
- [ ] Email channel integrated
- [ ] User preferences implemented
- [ ] RFC 7807 error handling
- [ ] Input validation added
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

# Check logs
docker-compose logs redis
```

### WebSocket Not Connecting

1. Ensure JWT token is valid
2. Check CORS settings
3. Verify Redis is running (for scaling)

### SendGrid Emails Not Sending

1. Verify `SENDGRID_API_KEY` is set
2. Check sender email is verified in SendGrid
3. Check SendGrid activity logs

---

## License

MIT

---

**Last updated:** 2026-01-11
