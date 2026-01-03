# AI_CONTEXT.md - Context for Claude Code

## Project Information

**Name:** Blog REST API
**Level:** Beginner
**Description:** Complete blog API with posts, comments, and categories using TypeORM
**ORM:** TypeORM
**Stack:** NestJS + TypeScript + PostgreSQL + TypeORM + JWT

---

## Project Structure

### Beginner Level (Modular 3-Layer)

```
src/
├── auth/                         # Auth feature module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── users/                        # Users feature module
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       └── user-response.dto.ts
├── posts/                        # Posts feature module
│   ├── posts.module.ts
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── posts.repository.ts
│   ├── entities/
│   │   └── post.entity.ts
│   └── dto/
│       ├── create-post.dto.ts
│       ├── update-post.dto.ts
│       ├── find-posts.dto.ts
│       └── post-response.dto.ts
├── categories/                   # Categories feature module
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   ├── categories.repository.ts
│   ├── entities/
│   │   └── category.entity.ts
│   └── dto/
│       ├── create-category.dto.ts
│       └── category-response.dto.ts
├── comments/                     # Comments feature module
│   ├── comments.module.ts
│   ├── comments.service.ts
│   ├── comments.repository.ts
│   ├── entities/
│   │   └── comment.entity.ts
│   └── dto/
│       ├── create-comment.dto.ts
│       └── comment-response.dto.ts
├── common/                       # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   └── pagination.dto.ts
│   └── utils/
│       └── slug.util.ts
├── config/                       # App configuration
│   ├── index.ts
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
├── database/                     # TypeORM setup
│   ├── database.module.ts
│   ├── data-source.ts
│   └── migrations/
├── app.module.ts
└── main.ts

test/
├── auth.e2e-spec.ts
├── posts.e2e-spec.ts
└── jest-e2e.json
```

---

## Architecture

### Beginner (3 layers)

```
Controller → Service → Repository → Database
```

**Patterns Used:**

- Repository Pattern (TypeORM repositories)
- Decorator Pattern (@CurrentUser, @Roles)
- Factory Pattern (DTOs with constructors)
- Singleton Pattern (NestJS services)

**Flow:**

```
HTTP Request
    ↓
Controller (validates request, Swagger docs)
    ↓
Service (business logic, authorization)
    ↓
Repository (TypeORM data access)
    ↓
PostgreSQL Database
```

---

## Entities

### User Entity

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.READER })
  role: UserRole;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Post Entity

```typescript
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  excerpt: string;

  @Column({ default: false })
  published: boolean;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('uuid')
  authorId: string;

  @ManyToOne(() => Category, (category) => category.posts)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column('uuid', { nullable: true })
  categoryId: string;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

### Category Entity

```typescript
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];
}
```

### Comment Entity

```typescript
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  postId: string;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### DTOs

**RegisterDto** (input)

- email: string (IsEmail, unique)
- password: string (MinLength 8)
- name: string (MinLength 2)
- role: UserRole (optional, default: reader)

**CreatePostDto** (input)

- title: string (MinLength 5, MaxLength 200)
- content: string (MinLength 50)
- excerpt?: string (MaxLength 300)
- categoryId?: string (UUID)
- published?: boolean

**PostResponseDto** (output)

- id, title, slug, content, excerpt, published
- author: { id, name }
- category: { id, name, slug } | null
- createdAt, updatedAt

---

## Security Requirements

### Authentication

- [x] JWT tokens (access token)
- [x] Password hashing (bcrypt, 10 rounds)
- [ ] Rate limiting (optional for beginner)

### Authorization

- [x] Role-based access (RBAC): author, reader
- [x] Resource ownership validation (authors can only edit/delete own posts)

### Validation

- [x] DTOs with class-validator
- [x] UUID validation on path parameters

### Error Handling

- [x] Consistent error responses
- [x] NotFoundException for missing resources
- [x] ForbiddenException for unauthorized actions
- [x] UnauthorizedException for invalid credentials

---

## Endpoints

### POST /auth/register

**Description:** Register a new user

**Request:**

```json
{
  "email": "author@example.com",
  "password": "password123",
  "name": "John Author",
  "role": "author"
}
```

**Success (201):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "author@example.com",
    "name": "John Author",
    "role": "author"
  }
}
```

### POST /auth/login

**Description:** Login user

**Request:**

```json
{
  "email": "author@example.com",
  "password": "password123"
}
```

**Success (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "author@example.com",
    "name": "John Author",
    "role": "author"
  }
}
```

### GET /posts

**Description:** List published posts with pagination

**Query params:** page, limit, categoryId, search

**Success (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My First Post",
      "slug": "my-first-post",
      "excerpt": "Introduction...",
      "published": true,
      "author": { "id": "uuid", "name": "John" },
      "category": { "id": "uuid", "name": "Tech", "slug": "tech" },
      "createdAt": "2026-01-03T..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST /posts

**Description:** Create a new post (author only)

**Headers:** Authorization: Bearer {token}

**Request:**

```json
{
  "title": "My First Post",
  "content": "This is the content of my first blog post...",
  "excerpt": "Introduction to my blog",
  "categoryId": "uuid",
  "published": true
}
```

**Success (201):** Returns PostResponseDto

### GET /posts/:slug

**Description:** Get post by slug with comments

**Success (200):**

```json
{
  "id": "uuid",
  "title": "My First Post",
  "slug": "my-first-post",
  "content": "Full content...",
  "author": { "id": "uuid", "name": "John" },
  "category": { "id": "uuid", "name": "Tech", "slug": "tech" },
  "comments": [
    {
      "id": "uuid",
      "content": "Great post!",
      "user": { "id": "uuid", "name": "Jane" },
      "createdAt": "2026-01-03T..."
    }
  ],
  "createdAt": "2026-01-03T..."
}
```

### POST /posts/:id/comments

**Description:** Add comment to a post (any authenticated user)

**Headers:** Authorization: Bearer {token}

**Request:**

```json
{
  "content": "Great post! Thanks for sharing."
}
```

**Success (201):** Returns CommentResponseDto

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('PostsService', () => {
  describe('create', () => {
    it('should create a post with auto-generated slug');
    it('should generate unique slug when title already exists');
    it('should throw NotFoundException when category not found');
  });

  describe('findAllPublished', () => {
    it('should return only published posts');
    it('should paginate results correctly');
    it('should filter by category');
  });

  describe('update', () => {
    it('should update post fields');
    it('should throw ForbiddenException when not author');
    it('should throw NotFoundException when post not found');
  });

  describe('remove', () => {
    it('should soft delete post');
    it('should throw ForbiddenException when not author');
  });
});
```

### E2E Tests

```typescript
describe('Posts Endpoints', () => {
  describe('GET /posts', () => {
    it('should return paginated published posts');
    it('should filter by category');
  });

  describe('POST /posts', () => {
    it('should create post when author is authenticated');
    it('should return 401 when not authenticated');
    it('should return 403 when user is reader');
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
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### ORM-Specific (TypeORM)

```json
{
  "typeorm": "^0.3.20",
  "@nestjs/typeorm": "^10.0.0",
  "pg": "^8.11.0"
}
```

### Project-Specific

```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1",
  "@nestjs/swagger": "^7.3.0",
  "@nestjs/config": "^3.2.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=admin
DATABASE_NAME=blog_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=3600

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

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Quick Reference

**Where does X go? (Modular 3-Layer):**

- Business logic → `src/{module}/{module}.service.ts`
- DTOs → `src/{module}/dto/`
- Database access → `src/{module}/{module}.repository.ts`
- Endpoints → `src/{module}/{module}.controller.ts`
- Entities → `src/{module}/entities/`

**TypeORM Commands:**

```bash
pnpm run typeorm migration:generate -- src/database/migrations/MigrationName
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

---

## Learning Goals

Upon completing this project:

- [x] Understand TypeORM entity decorators and relationships
- [x] Implement JWT authentication with role-based access
- [x] Create RESTful APIs with proper HTTP methods and status codes
- [x] Use soft delete pattern with TypeORM
- [x] Implement pagination and filtering
- [x] Generate SEO-friendly slugs

---

## Next Steps

After completion:

1. Add post tags (many-to-many relationship)
2. Implement comment moderation
3. Add full-text search with PostgreSQL

Then proceed to: **E-commerce Backend** (Intermediate level, TypeORM)

---

**Last updated:** 2026-01-03
