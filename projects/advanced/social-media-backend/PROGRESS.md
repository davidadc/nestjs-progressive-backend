# Social Media Backend - Implementation Progress

**Project:** social-media-backend
**Level:** Advanced
**ORM:** TypeORM
**Architecture:** 5-Layer DDD + CQRS

---

## Project Overview

**Description:** Social network backend with posts, likes, comments, followers, and personalized feed. Implements DDD patterns with CQRS, domain events, and RFC 7807 error handling.

**Technical Requirements:**

- JWT authentication with access/refresh tokens
- Complex relationships (followers, likes, comments)
- Personalized feed algorithm (posts from followed users)
- Hashtag extraction and trending
- Denormalized counters (likesCount, commentsCount, followersCount)
- Feed caching with Redis
- RFC 7807 Problem Details for all errors
- CQRS with Command/Query separation
- Domain Events for side effects

---

## Implementation Status

### Phase 1: Project Scaffolding

- [ ] Initialize NestJS project with CLI
- [ ] Install core dependencies (@nestjs/cqrs, @nestjs/typeorm)
- [ ] Install validation dependencies (class-validator, class-transformer)
- [ ] Install documentation (@nestjs/swagger)
- [ ] Install auth dependencies (@nestjs/jwt, @nestjs/passport, bcrypt)
- [ ] Install Redis dependencies (@nestjs/cache-manager, ioredis)
- [ ] Create .env and .env.example files
- [ ] Set up Advanced DDD folder structure

### Phase 2: Database Setup (TypeORM)

- [ ] Configure TypeORM module with PostgreSQL
- [ ] Create User ORM entity
- [ ] Create Post ORM entity
- [ ] Create Comment ORM entity
- [ ] Create Like ORM entity
- [ ] Create Follow ORM entity
- [ ] Create Hashtag ORM entity
- [ ] Create PostHashtag junction entity
- [ ] Generate initial migration
- [ ] Run migrations

### Phase 3: Common Module

- [ ] Create AggregateRoot base class
- [ ] Create DomainEvent base class
- [ ] Create ValueObject base class
- [ ] Create ProblemDetails exception
- [ ] Create ProblemDetailsFactory with error types:
  - [ ] notFound
  - [ ] unauthorized
  - [ ] forbidden
  - [ ] conflict (duplicate)
  - [ ] validationError
  - [ ] invalidInput
- [ ] Create ProblemDetailsFilter (global exception filter)
- [ ] Create ResponseEnvelopeInterceptor
- [ ] Create CurrentUser decorator
- [ ] Create pagination DTOs

### Phase 4: Auth Module

- [ ] Create auth.module.ts
- [ ] Create JWT strategy
- [ ] Create JWT auth guard
- [ ] Create LoginCommand and handler
- [ ] Create RegisterCommand (delegates to UsersModule)
- [ ] Create RefreshTokenCommand and handler
- [ ] Create login.dto.ts with validation
- [ ] Create auth-response.dto.ts (tokens)
- [ ] Create auth.controller.ts with endpoints:
  - [ ] POST /auth/register
  - [ ] POST /auth/login
  - [ ] POST /auth/refresh
  - [ ] GET /auth/profile

### Phase 5: Users Module (Domain Layer)

- [ ] Create users.module.ts
- [ ] Create User aggregate root
- [ ] Create value objects:
  - [ ] UserId
  - [ ] Email
  - [ ] Username
- [ ] Create domain events:
  - [ ] UserRegisteredEvent
  - [ ] UserFollowedEvent
  - [ ] UserUnfollowedEvent
- [ ] Create IUserRepository interface

### Phase 6: Users Module (Application Layer)

- [ ] Create commands:
  - [ ] RegisterUserCommand + Handler
  - [ ] FollowUserCommand + Handler
  - [ ] UnfollowUserCommand + Handler
  - [ ] UpdateProfileCommand + Handler
- [ ] Create queries:
  - [ ] GetUserProfileQuery + Handler
  - [ ] GetFollowersQuery + Handler
  - [ ] GetFollowingQuery + Handler
  - [ ] SearchUsersQuery + Handler
- [ ] Create DTOs:
  - [ ] register-user.dto.ts
  - [ ] update-profile.dto.ts
  - [ ] user-response.dto.ts
  - [ ] user-list-response.dto.ts
- [ ] Create UserMapper

### Phase 7: Users Module (Infrastructure Layer)

- [ ] Create User ORM entity mapping
- [ ] Create Follow ORM entity mapping
- [ ] Create UserRepository implementation
- [ ] Create users.controller.ts with endpoints:
  - [ ] GET /users/:id
  - [ ] GET /users/:id/followers
  - [ ] GET /users/:id/following
  - [ ] POST /users/:id/follow
  - [ ] DELETE /users/:id/follow
  - [ ] GET /users/search
- [ ] Create UserFollowedEventHandler (update counters)

### Phase 8: Posts Module (Domain Layer)

- [ ] Create posts.module.ts
- [ ] Create Post aggregate root
- [ ] Create value objects:
  - [ ] PostId
  - [ ] PostContent (with length validation)
- [ ] Create domain events:
  - [ ] PostCreatedEvent
  - [ ] PostDeletedEvent
  - [ ] PostLikedEvent
  - [ ] PostUnlikedEvent
- [ ] Create IPostRepository interface

### Phase 9: Posts Module (Application Layer)

- [ ] Create commands:
  - [ ] CreatePostCommand + Handler
  - [ ] DeletePostCommand + Handler
  - [ ] LikePostCommand + Handler
  - [ ] UnlikePostCommand + Handler
- [ ] Create queries:
  - [ ] GetPostQuery + Handler
  - [ ] GetUserPostsQuery + Handler
  - [ ] GetPostLikesQuery + Handler
- [ ] Create DTOs:
  - [ ] create-post.dto.ts
  - [ ] post-response.dto.ts
  - [ ] post-list-response.dto.ts
- [ ] Create PostMapper
- [ ] Create HashtagExtractorService

### Phase 10: Posts Module (Infrastructure Layer)

- [ ] Create Post ORM entity mapping
- [ ] Create Like ORM entity mapping
- [ ] Create PostRepository implementation
- [ ] Create LikeRepository implementation
- [ ] Create posts.controller.ts with endpoints:
  - [ ] POST /posts
  - [ ] GET /posts/:id
  - [ ] DELETE /posts/:id
  - [ ] POST /posts/:id/like
  - [ ] DELETE /posts/:id/like
  - [ ] GET /posts/:id/likes
- [ ] Create PostLikedEventHandler (update counters)

### Phase 11: Comments Module

- [ ] Create comments.module.ts
- [ ] Create Comment entity
- [ ] Create commands:
  - [ ] CreateCommentCommand + Handler
  - [ ] DeleteCommentCommand + Handler
  - [ ] LikeCommentCommand + Handler
- [ ] Create queries:
  - [ ] GetPostCommentsQuery + Handler
- [ ] Create DTOs
- [ ] Create CommentRepository
- [ ] Add comment endpoints to posts.controller.ts:
  - [ ] POST /posts/:id/comments
  - [ ] GET /posts/:id/comments
  - [ ] DELETE /posts/:postId/comments/:commentId

### Phase 12: Hashtags Module

- [ ] Create hashtags.module.ts
- [ ] Create Hashtag entity
- [ ] Create HashtagRepository
- [ ] Create queries:
  - [ ] GetTrendingHashtagsQuery + Handler
  - [ ] GetPostsByHashtagQuery + Handler
- [ ] Create hashtags.controller.ts with endpoints:
  - [ ] GET /hashtags/trending
  - [ ] GET /hashtags/:tag/posts

### Phase 13: Feed Module

- [ ] Create feed.module.ts
- [ ] Create FeedService with algorithm:
  - [ ] Get posts from followed users
  - [ ] Order by recency
  - [ ] Support cursor-based pagination
- [ ] Create FeedCacheService (Redis)
- [ ] Create queries:
  - [ ] GetPersonalizedFeedQuery + Handler
  - [ ] GetTrendingFeedQuery + Handler
- [ ] Create feed.controller.ts with endpoints:
  - [ ] GET /feed
  - [ ] GET /feed/trending

### Phase 14: Notifications Module (Basic)

- [ ] Create notifications.module.ts
- [ ] Create Notification entity
- [ ] Create NotificationRepository
- [ ] Create event handlers:
  - [ ] UserFollowedNotificationHandler
  - [ ] PostLikedNotificationHandler
  - [ ] CommentAddedNotificationHandler
- [ ] Create queries:
  - [ ] GetUserNotificationsQuery + Handler
- [ ] Create commands:
  - [ ] MarkNotificationReadCommand + Handler
- [ ] Create notifications.controller.ts with endpoints:
  - [ ] GET /notifications
  - [ ] PATCH /notifications/:id/read
  - [ ] PATCH /notifications/read-all

### Phase 15: Configuration

- [ ] Create database.config.ts
- [ ] Create jwt.config.ts
- [ ] Create redis.config.ts
- [ ] Wire up ConfigModule with validation
- [ ] Set up environment validation (Joi/class-validator)

### Phase 16: App Module Integration

- [ ] Update AppModule with all module imports
- [ ] Configure main.ts with:
  - [ ] Swagger documentation at `/docs` endpoint
  - [ ] Global ValidationPipe
  - [ ] Global ProblemDetailsFilter
  - [ ] Global ResponseEnvelopeInterceptor
  - [ ] CORS configuration
  - [ ] Request ID middleware

### Phase 17: API Integration Testing (Scripts)

- [ ] Create `scripts/` directory
- [ ] Create `seed-data.sh` for test data population
  - [ ] Seed sample users
  - [ ] Seed sample posts with hashtags
  - [ ] Seed follow relationships
  - [ ] Seed likes and comments
  - [ ] Add cleanup/reset function
- [ ] Create `test-api.sh` for endpoint testing
  - [ ] Health check verification
  - [ ] Auth endpoints (register, login, refresh, profile)
  - [ ] User endpoints (profile, follow, unfollow, followers, search)
  - [ ] Post endpoints (create, get, delete, like, unlike)
  - [ ] Comment endpoints (create, list, delete)
  - [ ] Feed endpoints (personalized, trending)
  - [ ] RFC 7807 error responses verification
  - [ ] Test summary with pass/fail counters
- [ ] Create user journey tests:
  - [ ] Journey: New User - Registration and First Post (Register -> Create profile -> Create post with hashtag -> View in own feed)
  - [ ] Journey: User - Social Interaction (Login -> Follow user -> Like post -> Comment -> View in feed)
  - [ ] Journey: User - Content Discovery (Browse trending -> Search users -> Follow -> View personalized feed)
  - [ ] Journey: User - Engagement Flow (Create post -> Receive likes -> View notifications -> Check stats)
- [ ] Make scripts executable (`chmod +x`)

### Phase 18: Unit & E2E Testing

- [ ] Create unit tests for Users module:
  - [ ] RegisterUserCommandHandler tests
  - [ ] FollowUserCommandHandler tests
  - [ ] User aggregate tests
  - [ ] Email value object tests
- [ ] Create unit tests for Posts module:
  - [ ] CreatePostCommandHandler tests
  - [ ] LikePostCommandHandler tests
  - [ ] Post aggregate tests
  - [ ] HashtagExtractorService tests
- [ ] Create unit tests for Feed module:
  - [ ] FeedService tests
  - [ ] GetPersonalizedFeedQueryHandler tests
- [ ] Create E2E tests:
  - [ ] Auth endpoints tests
  - [ ] Users endpoints tests
  - [ ] Posts endpoints tests
  - [ ] Feed endpoints tests
- [ ] Achieve 80%+ coverage on core logic

### Phase 19: Documentation

- [ ] Complete Swagger API documentation with:
  - [ ] All endpoints documented
  - [ ] Request/response examples
  - [ ] Authentication documentation
  - [ ] RFC 7807 error examples
- [ ] PROGRESS.md updated (this file)
- [ ] AI_CONTEXT.md verified
- [ ] README.md updated with final details

---

## Endpoints

### Authentication

| Method | Endpoint              | Description    | Auth Required |
| ------ | --------------------- | -------------- | ------------- |
| POST   | `/api/v1/auth/register` | Register user | No            |
| POST   | `/api/v1/auth/login`    | Login         | No            |
| POST   | `/api/v1/auth/refresh`  | Refresh token | Yes           |
| GET    | `/api/v1/auth/profile`  | Get profile   | Yes           |

### Users

| Method | Endpoint                       | Description      | Auth Required |
| ------ | ------------------------------ | ---------------- | ------------- |
| GET    | `/api/v1/users/:id`            | Get user profile | No            |
| PATCH  | `/api/v1/users/:id`            | Update profile   | Yes (owner)   |
| GET    | `/api/v1/users/:id/followers`  | Get followers    | No            |
| GET    | `/api/v1/users/:id/following`  | Get following    | No            |
| POST   | `/api/v1/users/:id/follow`     | Follow user      | Yes           |
| DELETE | `/api/v1/users/:id/follow`     | Unfollow user    | Yes           |
| GET    | `/api/v1/users/search`         | Search users     | No            |

### Posts

| Method | Endpoint                              | Description    | Auth Required |
| ------ | ------------------------------------- | -------------- | ------------- |
| POST   | `/api/v1/posts`                       | Create post    | Yes           |
| GET    | `/api/v1/posts/:id`                   | Get post       | No            |
| DELETE | `/api/v1/posts/:id`                   | Delete post    | Yes (owner)   |
| POST   | `/api/v1/posts/:id/like`              | Like post      | Yes           |
| DELETE | `/api/v1/posts/:id/like`              | Unlike post    | Yes           |
| GET    | `/api/v1/posts/:id/likes`             | Get likes      | No            |
| POST   | `/api/v1/posts/:id/comments`          | Add comment    | Yes           |
| GET    | `/api/v1/posts/:id/comments`          | Get comments   | No            |
| DELETE | `/api/v1/posts/:postId/comments/:id`  | Delete comment | Yes (owner)   |

### Feed

| Method | Endpoint              | Description       | Auth Required |
| ------ | --------------------- | ----------------- | ------------- |
| GET    | `/api/v1/feed`        | Personalized feed | Yes           |
| GET    | `/api/v1/feed/trending` | Trending posts  | No            |

### Hashtags

| Method | Endpoint                    | Description        | Auth Required |
| ------ | --------------------------- | ------------------ | ------------- |
| GET    | `/api/v1/hashtags/trending` | Trending hashtags  | No            |
| GET    | `/api/v1/hashtags/:tag/posts` | Posts by hashtag | No            |

### Notifications

| Method | Endpoint                       | Description         | Auth Required |
| ------ | ------------------------------ | ------------------- | ------------- |
| GET    | `/api/v1/notifications`        | Get notifications   | Yes           |
| PATCH  | `/api/v1/notifications/:id/read` | Mark as read      | Yes           |
| PATCH  | `/api/v1/notifications/read-all` | Mark all as read  | Yes           |

---

## Entities / Models

```typescript
// User
{
  id: string;
  email: string;
  username: string;
  name: string;
  password: string; // hashed
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Post
{
  id: string;
  authorId: string;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comment
{
  id: string;
  postId: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Like
{
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  createdAt: Date;
}

// Follow
{
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// Hashtag
{
  id: string;
  tag: string;
  usageCount: number;
  createdAt: Date;
}

// PostHashtag (junction)
{
  postId: string;
  hashtagId: string;
}

// Notification
{
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'comment';
  actorId: string;
  targetId: string;
  read: boolean;
  createdAt: Date;
}
```

---

## Folder Structure

```
social-media-backend/
├── src/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   │   └── user.aggregate.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── user-id.vo.ts
│   │   │   │   ├── email.vo.ts
│   │   │   │   └── username.vo.ts
│   │   │   ├── events/
│   │   │   │   ├── user-registered.event.ts
│   │   │   │   └── user-followed.event.ts
│   │   │   └── repositories/
│   │   │       └── user.repository.interface.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   ├── dto/
│   │   │   └── mappers/
│   │   └── infrastructure/
│   │       ├── controllers/
│   │       ├── persistence/
│   │       └── event-handlers/
│   │
│   ├── posts/
│   │   └── (same structure as users)
│   │
│   ├── comments/
│   ├── likes/
│   ├── feed/
│   ├── hashtags/
│   ├── notifications/
│   ├── auth/
│   │
│   ├── common/
│   │   ├── domain/
│   │   │   ├── aggregate-root.ts
│   │   │   ├── domain-event.ts
│   │   │   └── value-object.ts
│   │   ├── filters/
│   │   │   └── problem-details.filter.ts
│   │   ├── exceptions/
│   │   │   ├── problem-details.exception.ts
│   │   │   └── problem-details.factory.ts
│   │   ├── interceptors/
│   │   │   └── response-envelope.interceptor.ts
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── redis.config.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── scripts/
│   ├── seed-data.sh
│   └── test-api.sh
│
├── test/
│   ├── users/
│   ├── posts/
│   ├── feed/
│   └── jest-e2e.json
│
├── .env.example
├── package.json
├── tsconfig.json
├── AI_CONTEXT.md
├── README.md
└── PROGRESS.md
```

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis (from monorepo root)
docker-compose up -d postgres redis

# Run migrations
pnpm run typeorm migration:run

# Start development server
pnpm run start:dev

# Access Swagger docs
open http://localhost:3000/docs

# Seed test data (optional)
./scripts/seed-data.sh

# Run API integration tests
./scripts/test-api.sh
```

---

## Test Coverage

```
Target: 80%+ on core logic

users/application/commands/*.ts    | 80%+ statements
posts/application/commands/*.ts    | 80%+ statements
feed/application/services/*.ts     | 80%+ statements
```

---

## Design Decisions

1. **CQRS Pattern:** Separating commands (write) and queries (read) for better scalability and maintainability. Commands modify state and publish events; queries are read-only.

2. **Domain Events:** Side effects (updating counters, sending notifications, invalidating cache) are handled through domain events, keeping the core logic clean.

3. **Value Objects:** Email, Username, PostContent are value objects with built-in validation, ensuring domain integrity.

4. **Denormalized Counters:** likesCount, commentsCount, followersCount are stored directly on entities for fast reads, updated via event handlers.

5. **Feed Algorithm:** Simple chronological feed from followed users, cached in Redis with cursor-based pagination for efficiency.

6. **RFC 7807 Error Handling:** All errors follow Problem Details standard for consistent, machine-readable error responses.

---

## Known Issues / TODOs

- [ ] Add image upload support for posts (integrate with File Upload API)
- [ ] Implement WebSocket for real-time notifications
- [ ] Add rate limiting per endpoint
- [ ] Consider read replicas for feed queries at scale
- [ ] Add post editing capability
- [ ] Implement blocked users feature

---

**Started:** 2026-01-05
**Completed:** In Progress
**Next Steps:** After completion, proceed to Payment Integration API
