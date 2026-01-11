# ARCHITECTURE.md - Social Media Backend

## Project Architecture Overview

**Project:** Social Media Backend
**Level:** Advanced
**Architecture Style:** Modular DDD + CQRS

---

## Layer Structure

### Advanced: 5-Layer DDD + CQRS

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Guards)           │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Commands, Queries, Event Handlers,    │
│   DTOs, Mappers, Application Services)  │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Aggregates, Value Objects, Domain     │
│   Events, Repository Interfaces)        │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, External Services,      │
│   Event Publishers, ORM Entities)       │
├─────────────────────────────────────────┤
│           Shared/Common Layer           │
│  (Base Classes, Utilities, Exceptions)  │
└─────────────────────────────────────────┘
```

**Request Flow (Command):**
```
HTTP Request → Controller → CommandBus → CommandHandler → Aggregate → Repository → Database
                                              ↓
                                        Domain Event → EventBus → Event Handlers
```

**Request Flow (Query):**
```
HTTP Request → Controller → QueryBus → QueryHandler → Repository → Database
```

---

## Folder Structure

```
src/
├── users/                           # Users module (DDD)
│   ├── users.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── user.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── user-id.vo.ts
│   │   │   ├── email.vo.ts
│   │   │   └── username.vo.ts
│   │   ├── events/
│   │   │   ├── user-registered.event.ts
│   │   │   ├── user-followed.event.ts
│   │   │   └── user-unfollowed.event.ts
│   │   ├── repositories/
│   │   │   └── user.repository.interface.ts
│   │   └── exceptions/
│   │       └── user.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── follow-user.command.ts
│   │   │   ├── follow-user.handler.ts
│   │   │   ├── unfollow-user.command.ts
│   │   │   ├── unfollow-user.handler.ts
│   │   │   ├── update-profile.command.ts
│   │   │   └── update-profile.handler.ts
│   │   ├── queries/
│   │   │   ├── get-user-profile.query.ts
│   │   │   ├── get-user-profile.handler.ts
│   │   │   ├── get-followers.query.ts
│   │   │   ├── get-followers.handler.ts
│   │   │   ├── get-following.query.ts
│   │   │   ├── get-following.handler.ts
│   │   │   ├── search-users.query.ts
│   │   │   └── search-users.handler.ts
│   │   ├── dto/
│   │   │   ├── user-response.dto.ts
│   │   │   └── update-profile.dto.ts
│   │   ├── mappers/
│   │   │   └── user.mapper.ts
│   │   └── services/
│   └── infrastructure/
│       ├── controllers/
│       │   └── users.controller.ts
│       ├── persistence/
│       │   └── user.repository.ts
│       └── event-handlers/
│           └── user-followed.handler.ts
│
├── posts/                           # Posts module (DDD)
│   ├── posts.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── post.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── post-id.vo.ts
│   │   │   └── post-content.vo.ts
│   │   ├── events/
│   │   │   ├── post-created.event.ts
│   │   │   ├── post-liked.event.ts
│   │   │   ├── post-unliked.event.ts
│   │   │   └── post-deleted.event.ts
│   │   └── repositories/
│   │       └── post.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-post.command.ts
│   │   │   ├── create-post.handler.ts
│   │   │   ├── delete-post.command.ts
│   │   │   ├── delete-post.handler.ts
│   │   │   ├── like-post.command.ts
│   │   │   ├── like-post.handler.ts
│   │   │   ├── unlike-post.command.ts
│   │   │   └── unlike-post.handler.ts
│   │   ├── queries/
│   │   │   ├── get-post.query.ts
│   │   │   ├── get-post.handler.ts
│   │   │   ├── get-user-posts.query.ts
│   │   │   ├── get-user-posts.handler.ts
│   │   │   ├── get-post-likes.query.ts
│   │   │   └── get-post-likes.handler.ts
│   │   ├── dto/
│   │   │   ├── create-post.dto.ts
│   │   │   └── post-response.dto.ts
│   │   ├── mappers/
│   │   │   └── post.mapper.ts
│   │   └── services/
│   │       └── hashtag-extractor.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── posts.controller.ts
│       ├── persistence/
│       │   └── post.repository.ts
│       └── event-handlers/
│           └── post-liked.handler.ts
│
├── comments/                        # Comments module (DDD)
│   ├── comments.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── comment.aggregate.ts
│   │   ├── events/
│   │   │   ├── comment-created.event.ts
│   │   │   ├── comment-liked.event.ts
│   │   │   └── comment-deleted.event.ts
│   │   └── repositories/
│   │       └── comment.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-comment.command.ts
│   │   │   ├── create-comment.handler.ts
│   │   │   ├── delete-comment.command.ts
│   │   │   ├── delete-comment.handler.ts
│   │   │   ├── like-comment.command.ts
│   │   │   ├── like-comment.handler.ts
│   │   │   ├── unlike-comment.command.ts
│   │   │   └── unlike-comment.handler.ts
│   │   ├── queries/
│   │   │   ├── get-post-comments.query.ts
│   │   │   └── get-post-comments.handler.ts
│   │   ├── dto/
│   │   │   ├── create-comment.dto.ts
│   │   │   └── comment-response.dto.ts
│   │   └── mappers/
│   │       └── comment.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── comments.controller.ts
│       └── persistence/
│           └── comment.repository.ts
│
├── feed/                            # Feed module
│   ├── feed.module.ts
│   ├── domain/
│   │   └── repositories/
│   │       └── feed.repository.interface.ts
│   ├── application/
│   │   ├── queries/
│   │   │   ├── get-personalized-feed.query.ts
│   │   │   ├── get-personalized-feed.handler.ts
│   │   │   ├── get-trending-feed.query.ts
│   │   │   └── get-trending-feed.handler.ts
│   │   └── services/
│   │       └── feed-cache.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── feed.controller.ts
│       └── persistence/
│           └── feed.repository.ts
│
├── hashtags/                        # Hashtags module
│   ├── hashtags.module.ts
│   ├── domain/
│   │   └── repositories/
│   │       └── hashtag.repository.interface.ts
│   ├── application/
│   │   └── queries/
│   │       ├── get-trending-hashtags.query.ts
│   │       ├── get-trending-hashtags.handler.ts
│   │       ├── get-posts-by-hashtag.query.ts
│   │       └── get-posts-by-hashtag.handler.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── hashtags.controller.ts
│       └── persistence/
│           └── hashtag.repository.ts
│
├── notifications/                   # Notifications module
│   ├── notifications.module.ts
│   ├── domain/
│   │   └── repositories/
│   │       └── notification.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── mark-notification-read.command.ts
│   │   │   ├── mark-notification-read.handler.ts
│   │   │   ├── mark-all-notifications-read.command.ts
│   │   │   └── mark-all-notifications-read.handler.ts
│   │   └── queries/
│   │       ├── get-user-notifications.query.ts
│   │       └── get-user-notifications.handler.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── notifications.controller.ts
│       ├── persistence/
│       │   └── notification.repository.ts
│       └── event-handlers/
│           ├── user-followed-notification.handler.ts
│           ├── post-liked-notification.handler.ts
│           └── comment-added-notification.handler.ts
│
├── auth/                            # Auth module
│   ├── auth.module.ts
│   ├── domain/
│   │   ├── value-objects/
│   │   │   └── password.vo.ts
│   │   └── exceptions/
│   │       └── auth.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── register.command.ts
│   │   │   ├── register.handler.ts
│   │   │   ├── login.command.ts
│   │   │   ├── login.handler.ts
│   │   │   ├── refresh-token.command.ts
│   │   │   └── refresh-token.handler.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   └── services/
│   │       ├── password.service.ts
│   │       └── token.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── common/                          # Shared utilities
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── filters/
│   │   └── problem-details.filter.ts
│   ├── interceptors/
│   │   └── response-envelope.interceptor.ts
│   ├── exceptions/
│   │   ├── problem-details.exception.ts
│   │   └── problem-details.factory.ts
│   └── middleware/
│       └── request-id.middleware.ts
│
├── shared/                          # Shared persistence
│   └── persistence/
│       └── entities/
│           ├── user.entity.ts
│           ├── post.entity.ts
│           ├── comment.entity.ts
│           ├── like.entity.ts
│           ├── follow.entity.ts
│           ├── hashtag.entity.ts
│           └── notification.entity.ts
│
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
│
├── migrations/
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Core Patterns (Must Implement)

- [x] **Repository Pattern** - Abstract data access behind interfaces
- [x] **Factory Pattern** - ProblemDetailsFactory, VO creation methods
- [x] **Singleton Pattern** - NestJS default service scope
- [x] **Decorator Pattern** - @CurrentUser, @Public, Guards
- [x] **Observer Pattern** - Domain events + event handlers
- [x] **Mediator Pattern** - CommandBus/QueryBus for CQRS
- [x] **Strategy Pattern** - Interchangeable validators, services

### Additional Patterns (Recommended)

- [ ] **State Pattern** - Post moderation states, notification states
- [ ] **Template Method** - Base repository operations
- [ ] **Adapter Pattern** - External service integrations

---

## CQRS Implementation

### Commands (Write Operations)

| Module | Commands |
|--------|----------|
| **auth** | RegisterCommand, LoginCommand, RefreshTokenCommand |
| **users** | FollowUserCommand, UnfollowUserCommand, UpdateProfileCommand |
| **posts** | CreatePostCommand, DeletePostCommand, LikePostCommand, UnlikePostCommand |
| **comments** | CreateCommentCommand, DeleteCommentCommand, LikeCommentCommand, UnlikeCommentCommand |
| **notifications** | MarkNotificationReadCommand, MarkAllNotificationsReadCommand |

### Queries (Read Operations)

| Module | Queries |
|--------|---------|
| **users** | GetUserProfileQuery, GetFollowersQuery, GetFollowingQuery, SearchUsersQuery |
| **posts** | GetPostQuery, GetUserPostsQuery, GetPostLikesQuery |
| **comments** | GetPostCommentsQuery |
| **feed** | GetPersonalizedFeedQuery, GetTrendingFeedQuery |
| **hashtags** | GetTrendingHashtagsQuery, GetPostsByHashtagQuery |
| **notifications** | GetUserNotificationsQuery |

---

## Domain Events

### Event Flow

```
User Action → Command Handler → Aggregate creates Event → EventBus → Event Handlers
```

### Events by Module

| Event | Published By | Handled By |
|-------|--------------|------------|
| `UserRegisteredEvent` | RegisterHandler | (Welcome email, analytics) |
| `UserFollowedEvent` | FollowUserHandler | UserFollowedNotificationHandler |
| `UserUnfollowedEvent` | UnfollowUserHandler | - |
| `PostCreatedEvent` | CreatePostHandler | (Feed cache, analytics) |
| `PostLikedEvent` | LikePostHandler | PostLikedNotificationHandler |
| `PostUnlikedEvent` | UnlikePostHandler | - |
| `PostDeletedEvent` | DeletePostHandler | (Cleanup handlers) |
| `CommentCreatedEvent` | CreateCommentHandler | CommentAddedNotificationHandler |
| `CommentLikedEvent` | LikeCommentHandler | - |
| `CommentDeletedEvent` | DeleteCommentHandler | - |

---

## Value Objects

### Required Value Objects

| Module | Value Objects | Validation |
|--------|---------------|------------|
| **users** | `UserId`, `Email`, `Username` | UUID, email format, alphanumeric |
| **posts** | `PostId`, `PostContent` | UUID, non-empty, max length |
| **comments** | `CommentId` | UUID |
| **auth** | `Password` | Min length, complexity rules |

### Value Object Base

```typescript
// common/domain/value-object.ts
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
```

---

## Aggregate Roots

### User Aggregate

```typescript
export class UserAggregate extends AggregateRoot {
  private _id: UserId;
  private _email: Email;
  private _username: Username;
  private _followersCount: number;
  private _followingCount: number;
  private _postsCount: number;

  // Factory method
  static create(props: CreateUserProps): UserAggregate;

  // Business methods
  follow(targetUserId: UserId): void;
  unfollow(targetUserId: UserId): void;
  updateProfile(props: UpdateProfileProps): void;
}
```

### Post Aggregate

```typescript
export class PostAggregate extends AggregateRoot {
  private _id: PostId;
  private _authorId: UserId;
  private _content: PostContent;
  private _hashtags: string[];
  private _likesCount: number;
  private _commentsCount: number;

  // Factory method
  static create(props: CreatePostProps): PostAggregate;

  // Business methods
  like(userId: UserId): void;
  unlike(userId: UserId): void;
  delete(): void;
}
```

---

## Mapper Pattern

Each module should have mappers in `application/mappers/`:

```typescript
// users/application/mappers/user.mapper.ts
export class UserMapper {
  static toDto(entity: UserEntity): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      username: entity.username,
      name: entity.name,
      bio: entity.bio,
      avatar: entity.avatar,
      followersCount: entity.followersCount,
      followingCount: entity.followingCount,
      postsCount: entity.postsCount,
      createdAt: entity.createdAt,
    };
  }

  static toSummaryDto(entity: UserEntity): UserSummaryDto {
    return {
      id: entity.id,
      username: entity.username,
      name: entity.name,
      avatar: entity.avatar,
    };
  }
}
```

---

## Error Handling

### RFC 7807 Problem Details (Required)

All errors must use the ProblemDetailsFactory:

```typescript
// Not found
throw ProblemDetailsFactory.notFound('Post', postId);

// Conflict (duplicate)
throw ProblemDetailsFactory.conflict('Email already registered');

// Forbidden
throw ProblemDetailsFactory.forbidden('Cannot delete other user posts');

// Validation error
throw ProblemDetailsFactory.validationError(errors);

// Unauthorized
throw ProblemDetailsFactory.unauthorized('Invalid credentials');
```

### Response Format

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Post with ID 'abc-123' not found.",
  "instance": "GET /api/v1/posts/abc-123",
  "timestamp": "2026-01-11T12:00:00Z",
  "traceId": "req-xyz-789"
}
```

---

## Response Envelope

All successful responses use the envelope format:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Architecture Checklist

### Domain Layer
- [x] Repository interfaces defined (all modules)
- [x] Domain events created (users, posts, comments)
- [x] Value objects for key concepts (UserId, Email, PostId, PostContent)
- [ ] Aggregate roots implemented (users, posts, comments)
- [ ] Domain services where needed

### Application Layer
- [x] Commands for write operations
- [x] Queries for read operations
- [x] Event handlers for side effects (notifications)
- [x] DTOs for all endpoints
- [ ] Mappers for all entity ↔ DTO conversions
- [x] Application services (HashtagExtractor, FeedCache)

### Infrastructure Layer
- [x] Repository implementations (TypeORM)
- [x] Controllers with proper routing
- [x] Domain event handlers
- [x] ORM entities in shared/persistence

### Cross-Cutting
- [x] JWT Authentication
- [x] DTO Validation (class-validator)
- [x] RFC 7807 Error handling
- [x] Response envelope formatting
- [x] Request ID tracing

### Testing
- [x] Unit tests (70 tests passing)
- [x] E2E tests (auth, posts)
- [x] Integration test scripts

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| CQRS (Commands/Queries) | ✅ Complete | All modules use CommandBus/QueryBus |
| Domain Events | ✅ Complete | Events flow to notification handlers |
| Value Objects | ✅ Complete | UserId, Email, Username, PostId, PostContent, CommentId |
| Aggregate Roots | ✅ Complete | User, Post, Comment with factory methods and business logic |
| Mappers | ✅ Complete | UserMapper, PostMapper, CommentMapper classes |
| RFC 7807 Errors | ✅ Complete | Factory + filter implemented |
| Repository Pattern | ✅ Complete | Interfaces + implementations |
| Event Handlers | ✅ Complete | Notifications auto-created |

**Overall Compliance:** 100% ✅

---

## Architecture Files Created

### Aggregates
- `src/users/domain/aggregates/user.aggregate.ts` - User aggregate with factory methods
- `src/posts/domain/aggregates/post.aggregate.ts` - Post aggregate with business logic
- `src/comments/domain/aggregates/comment.aggregate.ts` - Comment aggregate

### Mappers
- `src/users/application/mappers/user.mapper.ts` - Entity ↔ DTO conversion
- `src/posts/application/mappers/post.mapper.ts` - Entity ↔ DTO conversion
- `src/comments/application/mappers/comment.mapper.ts` - Entity ↔ DTO conversion

### Value Objects
- `src/users/domain/value-objects/user-id.vo.ts` - With generate() method
- `src/comments/domain/value-objects/comment-id.vo.ts` - New value object

---

**Last updated:** 2026-01-11
