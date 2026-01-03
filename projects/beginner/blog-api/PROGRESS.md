# Blog REST API - Implementation Progress

**Project:** blog-api
**Level:** Beginner
**ORM:** TypeORM
**Architecture:** 3-Layer (Controller → Service → Repository → Database)

---

## Project Overview

**Description:** Complete blog API with posts, comments, and categories. First TypeORM project in the monorepo.

**Technical Requirements:**

- Relationships: Author → Posts → Comments, Posts → Category
- Categories for posts
- Timestamps (createdAt, updatedAt)
- Soft delete for posts
- JWT authentication with role-based access (author/reader)
- Users can choose their role at registration

---

## Implementation Status

### Phase 1: Project Scaffolding

- [x] Create AI_CONTEXT.md from template (available throughout development)
- [x] Initialize NestJS project with CLI (`nest new blog-api --package-manager=pnpm --strict`)
- [x] Install core dependencies (@nestjs/typeorm, typeorm, pg)
- [x] Install auth dependencies (@nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt)
- [x] Install validation dependencies (class-validator, class-transformer)
- [x] Install documentation (@nestjs/swagger, @nestjs/config)
- [x] Create .env and .env.example files
- [x] Set up folder structure
- [x] Update README.md with basic project info and setup instructions

### Phase 2: Database Setup (TypeORM)

- [x] Configure TypeORM module with async configuration
- [x] Create data-source.ts for CLI migrations
- [x] Create User entity with UserRole enum
- [x] Create Post entity with soft delete (@DeleteDateColumn)
- [x] Create Category entity
- [x] Create Comment entity
- [x] Define relationships (@ManyToOne, @OneToMany)
- [x] Generate initial migration
- [x] Run migrations

### Phase 3: Common Module

- [x] Create @CurrentUser() decorator
- [x] Create @Roles() decorator
- [x] Create PaginationDto
- [x] Create slug utility function

### Phase 4: Auth Module

- [x] Create UsersRepository
- [x] Create UsersService
- [x] Create AuthService (register, login, validateUser)
- [x] Create JWT strategy
- [x] Create JwtAuthGuard
- [x] Create RolesGuard
- [x] Create RegisterDto and LoginDto
- [x] Create AuthResponseDto and UserResponseDto
- [x] Create AuthController with Swagger docs
- [x] Wire up AuthModule

### Phase 5: Categories Module

- [x] Create CategoriesRepository
- [x] Create CategoriesService with slug generation
- [x] Create CreateCategoryDto
- [x] Create CategoryResponseDto
- [x] Create CategoriesController with Swagger docs
- [x] Wire up CategoriesModule

### Phase 6: Posts Module

- [x] Create PostsRepository with:
  - [x] Pagination support
  - [x] Search (title/content)
  - [x] Category filter
  - [x] Soft delete queries (exclude deleted)
- [x] Create PostsService with:
  - [x] Auto-generate unique slugs
  - [x] Ownership validation for update/delete
- [x] Create CreatePostDto and UpdatePostDto
- [x] Create FindPostsDto (pagination + filters)
- [x] Create PostResponseDto and PostWithCommentsResponseDto
- [x] Create PostsController with Swagger docs
- [x] Wire up PostsModule

### Phase 7: Comments Module

- [x] Create CommentsRepository
- [x] Create CommentsService
- [x] Create CreateCommentDto
- [x] Create CommentResponseDto
- [x] Add comment endpoint to PostsController (POST /posts/:id/comments)
- [x] Wire up CommentsModule

### Phase 8: App Module Integration

- [x] Update AppModule with all imports
- [x] Configure main.ts with:
  - [x] Swagger documentation
  - [x] Global ValidationPipe
  - [x] CORS configuration

### Phase 9: Testing

- [x] Create unit tests for AuthService
- [x] Create unit tests for CategoriesService
- [x] Create unit tests for PostsService
- [x] Create unit tests for CommentsService
- [ ] Create E2E tests for critical flows
- [x] Achieve 100% coverage on core service logic

### Phase 10: Final Documentation

- [x] Swagger API documentation complete
- [x] PROGRESS.md updated with completion status
- [x] README.md finalized with full API documentation
- [x] Verify all endpoints documented in Swagger

---

## Endpoints

### Auth

| Method | Endpoint         | Description                               | Auth Required |
| ------ | ---------------- | ----------------------------------------- | ------------- |
| POST   | `/auth/register` | Register user (choose author/reader role) | No            |
| POST   | `/auth/login`    | Login, get JWT token                      | No            |
| GET    | `/auth/profile`  | Get current user profile                  | Yes           |

### Posts

| Method | Endpoint               | Description                    | Auth Required | Role   |
| ------ | ---------------------- | ------------------------------ | ------------- | ------ |
| GET    | `/posts`               | List published posts           | No            | -      |
| GET    | `/posts/:slug`         | Get post by slug with comments | No            | -      |
| POST   | `/posts`               | Create new post                | Yes           | Author |
| PUT    | `/posts/:slug`         | Update own post                | Yes           | Author |
| DELETE | `/posts/:slug`         | Soft delete own post           | Yes           | Author |
| POST   | `/posts/:id/comments`  | Add comment to post            | Yes           | Any    |

### Categories

| Method | Endpoint            | Description              | Auth Required | Role   |
| ------ | ------------------- | ------------------------ | ------------- | ------ |
| GET    | `/categories`       | List all categories      | No            | -      |
| GET    | `/categories/:slug` | Get category with posts  | No            | -      |
| POST   | `/categories`       | Create category          | Yes           | Author |

---

## Entities / Models

```typescript
// User
{
  id: string;           // UUID
  email: string;        // Unique
  name: string;
  password: string;     // Hashed with bcrypt
  role: 'author' | 'reader';
  createdAt: Date;
  updatedAt: Date;
}

// Post
{
  id: string;           // UUID
  title: string;
  slug: string;         // Unique, auto-generated from title
  content: string;      // Text
  excerpt?: string;     // Optional summary
  published: boolean;   // Default: false
  authorId: string;     // FK -> User
  categoryId?: string;  // FK -> Category (optional)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;     // Soft delete
}

// Category
{
  id: string;           // UUID
  name: string;
  slug: string;         // Unique, auto-generated from name
}

// Comment
{
  id: string;           // UUID
  content: string;      // Text
  postId: string;       // FK -> Post
  userId: string;       // FK -> User
  createdAt: Date;
}
```

### Entity Relationships

```
User (1) ──────< Post (N) ──────< Comment (N)
                   │
                   └──────> Category (1)
```

- User has many Posts (author)
- User has many Comments
- Post belongs to User (author)
- Post belongs to Category (optional)
- Post has many Comments
- Comment belongs to Post
- Comment belongs to User
- Category has many Posts

---

## Folder Structure

```
blog-api/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       └── user-response.dto.ts
│   ├── posts/
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── posts.repository.ts
│   │   ├── entities/
│   │   │   └── post.entity.ts
│   │   └── dto/
│   │       ├── create-post.dto.ts
│   │       ├── update-post.dto.ts
│   │       ├── find-posts.dto.ts
│   │       └── post-response.dto.ts
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   ├── categories.repository.ts
│   │   ├── entities/
│   │   │   └── category.entity.ts
│   │   └── dto/
│   │       ├── create-category.dto.ts
│   │       └── category-response.dto.ts
│   ├── comments/
│   │   ├── comments.module.ts
│   │   ├── comments.service.ts
│   │   ├── comments.repository.ts
│   │   ├── entities/
│   │   │   └── comment.entity.ts
│   │   └── dto/
│   │       ├── create-comment.dto.ts
│   │       └── comment-response.dto.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   └── utils/
│   │       └── slug.util.ts
│   ├── config/
│   │   ├── index.ts
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── data-source.ts
│   │   └── migrations/
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── auth.e2e-spec.ts
│   ├── posts.e2e-spec.ts
│   └── jest-e2e.json
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
├── AI_CONTEXT.md
├── README.md
└── PROGRESS.md
```

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (from monorepo root)
docker-compose up -d postgres

# Run migrations
pnpm run typeorm migration:run

# Start development server
pnpm run start:dev

# Access Swagger docs
open http://localhost:3000/docs
```

---

## Test Coverage

```
auth.service.ts        | 100% statements | 100% functions
categories.service.ts  | 100% statements | 100% functions
posts.service.ts       | 100% statements | 100% functions
comments.service.ts    | 100% statements | 100% functions
```

---

## Design Decisions

1. **TypeORM over Prisma:** This project uses TypeORM to demonstrate different ORM patterns compared to notes-app and crud-api (which use Prisma). TypeORM provides decorator-based entity definitions and more direct SQL control.

2. **Role at Registration:** Users can choose their role (author/reader) during registration for simplicity. This avoids needing an admin module for this beginner project.

3. **Slug-based Post URLs:** Posts use slugs instead of UUIDs in URLs for SEO-friendliness and better readability (e.g., `/posts/my-first-blog-post`).

4. **Soft Delete for Posts:** Posts are soft-deleted (using @DeleteDateColumn) to allow recovery and maintain referential integrity with comments.

5. **Comment endpoint nested under Posts:** Comments are added via `/posts/:id/comments` to make the API more intuitive and RESTful.

---

## Known Issues / TODOs

- [ ] Consider adding post draft/preview functionality
- [ ] Consider adding comment moderation
- [ ] Consider adding post search with full-text indexing
- [ ] Consider adding post tags (many-to-many relationship)

---

**Started:** 2026-01-03
**Completed:** 2026-01-03
**Next Steps:** After completion, proceed to Intermediate level projects (e.g., E-commerce Backend)
