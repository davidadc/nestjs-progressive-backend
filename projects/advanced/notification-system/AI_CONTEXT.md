# AI_CONTEXT.md - Context for Claude Code

---

## Project Information

**Name:** Real-time Notification System
**Level:** Advanced
**Description:** Multi-platform real-time notification system with WebSocket, email, SMS, and push notification support
**ORM:** Drizzle
**Stack:** NestJS + TypeScript + PostgreSQL + Drizzle + Socket.io + Redis

---

## Project Structure

### Advanced Level (Modular + Full DDD)

```
src/
├── notifications/                    # Main notification module with DDD
│   ├── notifications.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── notification.aggregate.ts
│   │   ├── entities/
│   │   │   └── notification.entity.ts
│   │   ├── value-objects/
│   │   │   ├── notification-id.vo.ts
│   │   │   ├── notification-type.vo.ts
│   │   │   └── notification-channel.vo.ts
│   │   ├── events/
│   │   │   ├── notification-created.event.ts
│   │   │   ├── notification-sent.event.ts
│   │   │   └── notification-read.event.ts
│   │   ├── repositories/
│   │   │   └── notification.repository.interface.ts
│   │   └── exceptions/
│   │       └── notification.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-notification.command.ts
│   │   │   ├── send-notification.command.ts
│   │   │   └── mark-as-read.command.ts
│   │   ├── queries/
│   │   │   ├── get-notifications.query.ts
│   │   │   └── get-unread-count.query.ts
│   │   ├── dto/
│   │   │   ├── create-notification.dto.ts
│   │   │   └── notification-response.dto.ts
│   │   ├── event-handlers/
│   │   │   └── notification-created.handler.ts
│   │   └── mappers/
│   │       └── notification.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── notifications.controller.ts
│       ├── persistence/
│       │   ├── drizzle/
│       │   │   └── schema.ts
│       │   └── notification.repository.ts
│       └── gateways/
│           └── notifications.gateway.ts
│
├── preferences/                       # User notification preferences
│   ├── preferences.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── notification-preference.entity.ts
│   │   └── repositories/
│   │       └── preference.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   └── update-preferences.command.ts
│   │   ├── queries/
│   │   │   └── get-preferences.query.ts
│   │   └── dto/
│   │       └── preference-response.dto.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── preferences.controller.ts
│       └── persistence/
│           └── preference.repository.ts
│
├── channels/                          # Notification delivery channels
│   ├── channels.module.ts
│   ├── domain/
│   │   └── channel.strategy.interface.ts
│   └── infrastructure/
│       ├── email/
│       │   └── sendgrid.channel.ts
│       ├── websocket/
│       │   └── websocket.channel.ts
│       ├── sms/
│       │   └── twilio.channel.ts
│       └── push/
│           └── fcm.channel.ts
│
├── users/                             # User management (simplified)
│   ├── users.module.ts
│   └── ...
│
├── auth/                              # JWT authentication
│   ├── auth.module.ts
│   └── ...
│
├── common/
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── problem-details.filter.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── exceptions/
│       └── problem-details.factory.ts
│
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── channels.config.ts
│
├── app.module.ts
└── main.ts

test/
├── notifications.service.spec.ts
├── notifications.e2e-spec.ts
└── jest-e2e.json
```

---

## Architecture

### Advanced (5+ layers with DDD + CQRS)

```
Controller → Command/Query Handler → Domain (Aggregates) → Repository
                    ↓
              Domain Event → EventBus → Event Handlers → Channels
```

**Patterns Used:**

- Repository Pattern (data abstraction)
- Factory Pattern (entity creation)
- Strategy Pattern (notification channels)
- Observer Pattern (domain events, WebSocket)
- Adapter Pattern (external services - SendGrid, Twilio, FCM)
- Mediator Pattern (CQRS - CommandBus/QueryBus)
- Template Method (base channel implementation)
- Domain Events (decouple notification creation from delivery)

**Flow:**

```
HTTP Request / WebSocket Event
    ↓
Controller / Gateway (validates request)
    ↓
CommandBus / QueryBus
    ↓
Command/Query Handler (orchestration)
    ↓
Domain Aggregate (business logic)
    ↓
Repository (data access via Drizzle)
    ↓
Domain Event → Event Handler → Channel Strategy → External Service
```

---

## Entities

### User Entity

```typescript
export class User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Entity

```typescript
export class Notification {
  id: string;
  userId: string;
  type: NotificationType; // 'order_completed' | 'new_comment' | 'new_follower' | 'liked_post' | 'mention'
  title: string;
  message: string;
  data: Record<string, any>; // Additional payload
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}
```

### NotificationPreference Entity

```typescript
export class NotificationPreference {
  id: string;
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  // Per-type preferences
  orderCompleted: ChannelPreferences;
  newComment: ChannelPreferences;
  newFollower: ChannelPreferences;
  likedPost: ChannelPreferences;
  mention: ChannelPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}
```

### DTOs

**CreateNotificationDto** (input)

- userId: string (required, UUID)
- type: NotificationType (required, enum)
- title: string (required, min: 1, max: 200)
- message: string (required, min: 1, max: 1000)
- data: object (optional)

**NotificationResponseDto** (output)

- id: string
- userId: string
- type: string
- title: string
- message: string
- data: object
- read: boolean
- readAt: string | null
- createdAt: string

**UpdatePreferencesDto** (input)

- email: boolean (optional)
- push: boolean (optional)
- sms: boolean (optional)

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

## Delivery Channels

| Channel | Provider | Priority | Reliability |
|---------|----------|----------|-------------|
| WebSocket | Socket.io | Real-time | Best-effort |
| Email | SendGrid | Async | Guaranteed |
| Push | FCM | Async | Best-effort |
| SMS | Twilio | Async | Guaranteed |

---

## Security Requirements

### Authentication

- [x] JWT tokens (access + refresh)
- [x] Password hashing (bcrypt)
- [x] Rate limiting (notifications/minute)

### Authorization

- [x] User can only view own notifications
- [x] User can only modify own preferences
- [x] WebSocket connections require valid JWT

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization
- [x] Message length limits

### Error Handling (RFC 7807)

- [x] Problem Details for all errors
- [x] No stack traces in production
- [x] Request tracing (X-Request-ID)

---

## Endpoints

### Notifications

#### GET /api/v1/notifications

**Description:** Get notification history for authenticated user

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `read`: boolean (filter by read status)
- `type`: string (filter by notification type)

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-id",
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

#### GET /api/v1/notifications/unread-count

**Description:** Get count of unread notifications

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "count": 5
  }
}
```

#### PATCH /api/v1/notifications/:id/read

**Description:** Mark a notification as read

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "notification-id",
    "read": true,
    "readAt": "2026-01-11T10:05:00Z"
  }
}
```

**Error (404) - RFC 7807:**

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

#### PATCH /api/v1/notifications/read-all

**Description:** Mark all notifications as read

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "markedCount": 12
  }
}
```

### Preferences

#### GET /api/v1/notifications/preferences

**Description:** Get user's notification preferences

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "pref-id",
    "userId": "user-id",
    "email": true,
    "push": true,
    "sms": false,
    "perType": {
      "order_completed": { "email": true, "push": true, "sms": false },
      "new_comment": { "email": false, "push": true, "sms": false }
    }
  }
}
```

#### PATCH /api/v1/notifications/preferences

**Description:** Update notification preferences

**Request:**

```json
{
  "email": true,
  "push": true,
  "sms": false
}
```

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "email": true,
    "push": true,
    "sms": false
  }
}
```

---

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe` | `{ token: string }` | Authenticate WebSocket connection |
| `mark_read` | `{ notificationId: string }` | Mark notification as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `NotificationResponseDto` | New notification received |
| `notification_read` | `{ id: string, readAt: string }` | Notification marked as read |
| `unread_count` | `{ count: number }` | Updated unread count |

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('NotificationService', () => {
  describe('create', () => {
    it('should create notification for valid user');
    it('should emit NotificationCreatedEvent');
    it('should throw when user not found');
  });

  describe('markAsRead', () => {
    it('should mark notification as read');
    it('should update readAt timestamp');
    it('should throw when notification not found');
    it('should throw when notification belongs to different user');
  });
});
```

### E2E Tests

```typescript
describe('Notifications Endpoints', () => {
  describe('GET /api/v1/notifications', () => {
    it('should return paginated notifications');
    it('should filter by read status');
    it('should require authentication');
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark notification as read');
    it('should return 404 for invalid id');
    it('should return 403 for other users notification');
  });
});
```

---

## Dependencies

### Core

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/cqrs": "^10.0.0",
  "@nestjs/jwt": "^12.0.0",
  "@nestjs/passport": "^10.0.0",
  "@nestjs/platform-socket.io": "^10.0.0",
  "@nestjs/websockets": "^10.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### Drizzle ORM

```json
{
  "drizzle-orm": "^0.29.0",
  "drizzle-kit": "^0.20.0",
  "postgres": "^3.4.0"
}
```

### External Services

```json
{
  "@sendgrid/mail": "^8.0.0",
  "twilio": "^4.0.0",
  "firebase-admin": "^12.0.0",
  "ioredis": "^5.3.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dev
DATABASE_PASSWORD=dev
DATABASE_NAME=notification_db
DATABASE_URL=postgresql://dev:dev@localhost:5432/notification_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=900

# Redis (for WebSocket scaling)
REDIS_HOST=localhost
REDIS_PORT=6379

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@example.com

# Twilio (SMS - Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Firebase (Push - Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# App
NODE_ENV=development
PORT=3000
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Commands: `*.command.ts`
- Queries: `*.query.ts`
- Events: `*.event.ts`
- Value Objects: `*.vo.ts`
- Gateways: `*.gateway.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation
- RFC 7807 for all error responses

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for notification-system with Advanced DDD+CQRS architecture"
```

### 2. Domain Layer

```
"Implement Notification aggregate, NotificationId and NotificationType value objects, and domain events"
```

### 3. Application Layer

```
"Implement CQRS commands (CreateNotification, MarkAsRead) and queries (GetNotifications, GetUnreadCount)"
```

### 4. Infrastructure Layer

```
"Implement NotificationsController, NotificationsGateway (WebSocket), and Drizzle repository"
```

### 5. Channels

```
"Implement notification channel strategy with SendGrid email adapter"
```

### 6. Testing

```
"Create unit tests for NotificationService and e2e tests for notification endpoints"
```

---

## Learning Goals

Upon completing this project:

- [x] Implement CQRS pattern with NestJS CqrsModule
- [x] Use domain events for decoupled side effects
- [x] Build real-time features with WebSocket (Socket.io)
- [x] Implement Strategy pattern for multiple notification channels
- [x] Use RFC 7807 Problem Details for error handling
- [x] Work with Drizzle ORM for type-safe database access
- [x] Scale WebSocket with Redis adapter

---

## Next Steps

After completion:

1. Add push notification support with Firebase Cloud Messaging
2. Implement notification batching and digest emails
3. Add notification templates with localization
4. Implement notification analytics and delivery tracking

Then proceed to: **Admin Dashboard API** (Advanced) or **Microservices** (Expert)

---

## Quick Reference

**Where does X go? (Advanced Level)**

- Business logic → `src/notifications/domain/aggregates/`
- Commands/Queries → `src/notifications/application/commands/` and `queries/`
- DTOs → `src/notifications/application/dto/`
- Database access → `src/notifications/infrastructure/persistence/`
- Endpoints → `src/notifications/infrastructure/controllers/`
- WebSocket → `src/notifications/infrastructure/gateways/`
- Domain entities → `src/notifications/domain/`
- External services → `src/channels/infrastructure/`

**Drizzle Commands:**

```bash
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
pnpm exec drizzle-kit studio
```

---

**Last updated:** 2026-01-11
**To use:** Run `claude code` from this project directory
