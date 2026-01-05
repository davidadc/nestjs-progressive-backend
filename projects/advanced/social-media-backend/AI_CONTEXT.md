# AI_CONTEXT.md - Context for Claude Code

---

## Project Information

**Name:** Social Media Backend
**Level:** Advanced
**Description:** Social network backend with posts, likes, comments, followers, and personalized feed
**ORM:** TypeORM
**Stack:** NestJS + TypeScript + PostgreSQL + TypeORM + Redis

---

## Project Structure

### Advanced Level (Modular + Full DDD)

```
src/
├── users/                         # Users feature module with DDD
│   ├── users.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── user.aggregate.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts
│   │   │   ├── user-id.vo.ts
│   │   │   └── username.vo.ts
│   │   ├── events/
│   │   │   ├── user-registered.event.ts
│   │   │   └── user-followed.event.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── register-user.command.ts
│   │   │   └── follow-user.command.ts
│   │   ├── queries/
│   │   │   ├── get-user-profile.query.ts
│   │   │   ├── get-followers.query.ts
│   │   │   └── search-users.query.ts
│   │   ├── dto/
│   │   │   ├── register-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── users.controller.ts
│       ├── persistence/
│       │   ├── user.orm-entity.ts
│       │   └── user.repository.ts
│       └── event-handlers/
│           └── user-followed.handler.ts
│
├── posts/                         # Posts feature module with DDD
│   ├── posts.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── post.aggregate.ts
│   │   ├── entities/
│   │   │   └── post.entity.ts
│   │   ├── value-objects/
│   │   │   ├── post-id.vo.ts
│   │   │   └── post-content.vo.ts
│   │   ├── events/
│   │   │   ├── post-created.event.ts
│   │   │   └── post-liked.event.ts
│   │   └── repositories/
│   │       └── post.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-post.command.ts
│   │   │   ├── like-post.command.ts
│   │   │   └── delete-post.command.ts
│   │   ├── queries/
│   │   │   ├── get-post.query.ts
│   │   │   ├── get-user-posts.query.ts
│   │   │   └── get-feed.query.ts
│   │   ├── dto/
│   │   │   ├── create-post.dto.ts
│   │   │   └── post-response.dto.ts
│   │   └── mappers/
│   │       └── post.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── posts.controller.ts
│       ├── persistence/
│       │   ├── post.orm-entity.ts
│       │   └── post.repository.ts
│       └── event-handlers/
│           └── post-liked.handler.ts
│
├── comments/                      # Comments feature module
│   ├── comments.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── likes/                         # Likes feature module
│   ├── likes.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── feed/                          # Feed feature module
│   ├── feed.module.ts
│   ├── application/
│   │   ├── queries/
│   │   │   └── get-personalized-feed.query.ts
│   │   └── services/
│   │       └── feed.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── feed.controller.ts
│       └── cache/
│           └── feed-cache.service.ts
│
├── hashtags/                      # Hashtags feature module
│   ├── hashtags.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── notifications/                 # Notifications feature module
│   ├── notifications.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── auth/                          # Authentication module
│   ├── auth.module.ts
│   ├── application/
│   │   ├── commands/
│   │   │   └── login.command.ts
│   │   └── dto/
│   │       └── login.dto.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── common/
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── domain-event.ts
│   │   └── value-object.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── problem-details.filter.ts
│   ├── exceptions/
│   │   ├── problem-details.exception.ts
│   │   └── problem-details.factory.ts
│   └── interceptors/
│       └── response-envelope.interceptor.ts
│
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── jwt.config.ts
│
├── app.module.ts
└── main.ts

test/
├── users/
│   ├── users.service.spec.ts
│   └── users.e2e-spec.ts
├── posts/
│   ├── posts.service.spec.ts
│   └── posts.e2e-spec.ts
└── jest-e2e.json
```

---

## Architecture

### Advanced (5+ layers with DDD)

```
Controller → Command/Query Handler → Domain (Aggregates) → Repository
```

**Patterns Used:**

- CQRS (Command Query Responsibility Segregation)
- Domain Events
- Value Objects
- Aggregates
- Repository Pattern
- Mediator Pattern
- Observer Pattern (Event Handlers)

**Flow:**

```
HTTP Request
    ↓
Controller (validates request, maps to Command/Query)
    ↓
Command/Query Handler (orchestrates business logic)
    ↓
Domain Aggregate (enforces business rules)
    ↓
Repository (persists changes)
    ↓
Event Bus (publishes domain events)
    ↓
Event Handlers (side effects: notifications, cache invalidation)
```

---

## Entities

### User Aggregate

```typescript
export class User extends AggregateRoot {
  private _id: UserId;
  private _email: Email;
  private _username: Username;
  private _name: string;
  private _avatar?: string;
  private _bio?: string;
  private _followersCount: number;
  private _followingCount: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  static create(props: CreateUserProps): User;
  follow(targetUserId: UserId): void;
  unfollow(targetUserId: UserId): void;
}
```

### Post Aggregate

```typescript
export class Post extends AggregateRoot {
  private _id: PostId;
  private _authorId: UserId;
  private _content: PostContent;
  private _images: string[];
  private _likesCount: number;
  private _commentsCount: number;
  private _hashtags: string[];
  private _createdAt: Date;
  private _updatedAt: Date;

  static create(props: CreatePostProps): Post;
  like(userId: UserId): void;
  unlike(userId: UserId): void;
  addComment(userId: UserId, content: string): Comment;
}
```

### Follow Entity

```typescript
export class Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}
```

### Like Entity

```typescript
export class Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  createdAt: Date;
}
```

### Comment Entity

```typescript
export class Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Hashtag Entity

```typescript
export class Hashtag {
  id: string;
  tag: string;
  usageCount: number;
  createdAt: Date;
}
```

---

## Security Requirements

### Authentication

- [x] JWT tokens with access/refresh
- [x] Password hashing (bcrypt)
- [x] Rate limiting on auth endpoints

### Authorization

- [x] Resource ownership validation (only owner can edit/delete)
- [x] Public vs private profile visibility

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization
- [x] Content length limits

### Error Handling (RFC 7807 MANDATORY)

- [x] Problem Details format for all errors
- [x] Request ID tracking
- [x] No stack traces in production
- [x] Security event logging

---

## Endpoints

### Authentication

| Method | Endpoint              | Description   | Auth |
| ------ | --------------------- | ------------- | ---- |
| POST   | `/api/v1/auth/register` | Register user | No   |
| POST   | `/api/v1/auth/login`    | Login         | No   |
| POST   | `/api/v1/auth/refresh`  | Refresh token | Yes  |
| GET    | `/api/v1/auth/profile`  | Get profile   | Yes  |

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

| Method | Endpoint                       | Description       | Auth |
| ------ | ------------------------------ | ----------------- | ---- |
| POST   | `/api/v1/posts`                | Create post       | Yes  |
| GET    | `/api/v1/posts/:id`            | Get post          | No   |
| DELETE | `/api/v1/posts/:id`            | Delete post       | Yes  |
| POST   | `/api/v1/posts/:id/like`       | Like post         | Yes  |
| DELETE | `/api/v1/posts/:id/like`       | Unlike post       | Yes  |
| GET    | `/api/v1/posts/:id/likes`      | Get likes         | No   |
| POST   | `/api/v1/posts/:id/comments`   | Add comment       | Yes  |
| GET    | `/api/v1/posts/:id/comments`   | Get comments      | No   |

### Feed

| Method | Endpoint           | Description        | Auth |
| ------ | ------------------ | ------------------ | ---- |
| GET    | `/api/v1/feed`     | Personalized feed  | Yes  |
| GET    | `/api/v1/feed/trending` | Trending posts | No   |

### Hashtags

| Method | Endpoint                  | Description          | Auth |
| ------ | ------------------------- | -------------------- | ---- |
| GET    | `/api/v1/hashtags/trending` | Trending hashtags  | No   |
| GET    | `/api/v1/hashtags/:tag/posts` | Posts by hashtag | No   |

---

## Error Response Format (RFC 7807)

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User with ID 'abc123' not found.",
  "instance": "GET /api/v1/users/abc123",
  "timestamp": "2026-01-05T10:00:00Z",
  "traceId": "req-xyz789"
}
```

---

## Success Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-05T10:00:00Z"
  }
}
```

With pagination:

```json
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('CreatePostCommandHandler', () => {
  describe('execute', () => {
    it('should create post with valid content');
    it('should extract hashtags from content');
    it('should publish PostCreatedEvent');
    it('should throw error when content exceeds limit');
  });
});
```

### E2E Tests

```typescript
describe('Posts Endpoints', () => {
  describe('POST /api/v1/posts', () => {
    it('should create post when authenticated');
    it('should return 401 when not authenticated');
    it('should return RFC 7807 error on validation failure');
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
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### TypeORM

```json
{
  "typeorm": "^0.3.0",
  "@nestjs/typeorm": "^10.0.0",
  "pg": "^8.11.0"
}
```

### Auth & Security

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0"
}
```

### Redis (for caching)

```json
{
  "@nestjs/cache-manager": "^2.0.0",
  "cache-manager": "^5.0.0",
  "cache-manager-redis-store": "^3.0.0",
  "ioredis": "^5.0.0"
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
DATABASE_NAME=social_media_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=900
JWT_REFRESH_EXPIRATION=604800

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

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
- Entities: `*.entity.ts` (domain) / `*.orm-entity.ts` (infrastructure)
- Commands: `*.command.ts`
- Queries: `*.query.ts`
- Events: `*.event.ts`
- Value Objects: `*.vo.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for Social Media Backend with Advanced DDD architecture"
```

### 2. Common Module

```
"Implement common module: AggregateRoot base class, DomainEvent, ValueObject, and RFC 7807 ProblemDetails filter"
```

### 3. Users Module

```
"Implement Users module with User aggregate, Email/Username value objects, register/follow commands, and repository"
```

### 4. Posts Module

```
"Implement Posts module with Post aggregate, create/like commands, PostCreatedEvent, and feed query"
```

### 5. Testing

```
"Create unit tests for CreatePostCommandHandler and e2e tests for posts endpoints"
```

---

## Learning Goals

Upon completing this project:

- [ ] Understand DDD concepts (Aggregates, Value Objects, Domain Events)
- [ ] Implement CQRS pattern with NestJS
- [ ] Apply RFC 7807 Problem Details for error handling
- [ ] Design personalized feed algorithm
- [ ] Implement efficient pagination and caching with Redis
- [ ] Handle complex relationships (followers, likes, comments)

---

## Next Steps

After completion:

1. Add WebSocket support for real-time notifications
2. Implement image upload for posts
3. Add advanced feed algorithm with ML recommendations

Then proceed to: **Payment Integration API**

---

## Quick Reference

**Where does X go? (Advanced Level with DDD)**

- Business logic → `src/{module}/application/commands/` or `src/{module}/application/queries/`
- DTOs → `src/{module}/application/dto/`
- Database access → `src/{module}/infrastructure/persistence/`
- Endpoints → `src/{module}/infrastructure/controllers/`
- Domain entities → `src/{module}/domain/entities/` or `src/{module}/domain/aggregates/`
- Value Objects → `src/{module}/domain/value-objects/`
- Domain Events → `src/{module}/domain/events/`
- Event Handlers → `src/{module}/infrastructure/event-handlers/`

**ORM Commands (TypeORM):**

```bash
pnpm run typeorm migration:generate -- --name MigrationName
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

---

**Last updated:** 2026-01-05
**To use:** Run `claude code` from project root
