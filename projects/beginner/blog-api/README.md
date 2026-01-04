# Blog REST API

Complete blog API with posts, comments, and categories.

**Level:** Beginner
**ORM:** TypeORM
**Architecture:** 3-Layer (Controller → Service → Repository)

---

## Features

- JWT authentication with role-based access (author/reader)
- CRUD operations for posts with soft delete
- Categories for organizing posts
- Comments on posts
- Pagination and search
- Swagger API documentation

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** TypeORM 0.3+
- **Auth:** JWT + Passport

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (via Docker Compose from monorepo root)

### Setup

```bash
# From monorepo root - start PostgreSQL
docker-compose up -d postgres

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Run migrations (after they are created)
pnpm run typeorm migration:run

# Start development server
pnpm run start:dev

# Access Swagger docs
open http://localhost:3000/docs
```

---

## API Endpoints

### Auth

| Method | Endpoint         | Description                     | Auth |
| ------ | ---------------- | ------------------------------- | ---- |
| POST   | `/auth/register` | Register user (author/reader)   | No   |
| POST   | `/auth/login`    | Login, get JWT token            | No   |
| GET    | `/auth/profile`  | Get current user profile        | Yes  |

### Posts

| Method | Endpoint              | Description              | Auth   | Role   |
| ------ | --------------------- | ------------------------ | ------ | ------ |
| GET    | `/posts`              | List published posts     | No     | -      |
| GET    | `/posts/:slug`        | Get post with comments   | No     | -      |
| POST   | `/posts`              | Create new post          | Yes    | Author |
| PUT    | `/posts/:slug`        | Update own post          | Yes    | Author |
| DELETE | `/posts/:slug`        | Soft delete own post     | Yes    | Author |
| POST   | `/posts/:id/comments` | Add comment to post      | Yes    | Any    |

### Categories

| Method | Endpoint            | Description             | Auth | Role   |
| ------ | ------------------- | ----------------------- | ---- | ------ |
| GET    | `/categories`       | List all categories     | No   | -      |
| GET    | `/categories/:slug` | Get category with posts | No   | -      |
| POST   | `/categories`       | Create category         | Yes  | Author |

---

## Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management
├── posts/          # Posts CRUD
├── categories/     # Categories
├── comments/       # Comments
├── common/         # Shared utilities
├── config/         # Configuration
├── database/       # TypeORM setup
├── app.module.ts
└── main.ts
```

---

## Scripts

```bash
pnpm run start:dev    # Development with watch
pnpm run build        # Production build
pnpm run test         # Unit tests
pnpm run test:e2e     # E2E tests
pnpm run test:cov     # Test coverage
```

---

## Testing

The project includes comprehensive unit tests for all services:

- **AuthService** - Registration, login, user validation
- **CategoriesService** - Category CRUD, slug generation
- **PostsService** - Post CRUD, ownership validation, soft delete
- **CommentsService** - Comment creation, deletion

All core services have **100% test coverage**.

---

## Environment Variables

See `.env.example` for all configuration options.

---

## Documentation

- `AI_CONTEXT.md` - Development context for Claude Code
- `PROGRESS.md` - Implementation progress tracking

---

## Potential Improvements

Future enhancements that could be added to this project:

### Content Features
- Post tags (many-to-many relationship)
- Draft/preview functionality for posts
- Rich text content support (Markdown or HTML)
- Featured images for posts
- Post scheduling (publish at future date)
- Related posts suggestions
- Reading time estimation

### Comments & Interaction
- Comment moderation (approve/reject)
- Nested/threaded comments (replies)
- Comment editing and deletion by author
- Like/upvote system for posts and comments
- Report inappropriate content

### Search & Discovery
- Full-text search with PostgreSQL
- Search highlighting in results
- Filter posts by date range
- Popular/trending posts
- Author profiles with post listing

### Authentication & Security
- Refresh tokens for extended sessions
- Password reset via email
- Email verification on registration
- Rate limiting on endpoints
- Account lockout after failed attempts

### Performance
- Redis caching for posts and categories
- Database indexing optimization
- Response compression
- Image optimization and CDN support

### API Enhancements
- API versioning (v1, v2)
- RSS feed generation
- Webhook notifications for new posts
- GraphQL alternative endpoint

---

## License

MIT
