# ARCHITECTURE.md - Blog REST API

## Project Architecture Overview

**Project:** Blog REST API
**Level:** Beginner
**Architecture Style:** Modular 3-Layer
**ORM:** TypeORM

---

## Layer Structure

### Beginner: 3-Layer Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, DTOs, Pipes, Guards)     │
├─────────────────────────────────────────┤
│           Business Layer                │
│  (Services, Business Logic)             │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│  (Repositories, Entities, TypeORM)      │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Guard → Controller → Service → Repository → Database
```

---

## Folder Structure

```
src/
├── auth/                           # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts          # Auth endpoints
│   ├── auth.service.ts             # Auth business logic
│   ├── auth.service.spec.ts        # Unit tests
│   ├── dto/
│   │   ├── register.dto.ts         # Registration input
│   │   ├── login.dto.ts            # Login input
│   │   └── auth-response.dto.ts    # Auth response
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # JWT protection
│   │   └── roles.guard.ts          # Role-based access
│   └── strategies/
│       └── jwt.strategy.ts         # JWT validation
├── users/                          # Users module
│   ├── users.module.ts
│   ├── users.service.ts            # User operations
│   ├── users.repository.ts         # User data access
│   ├── entities/
│   │   └── user.entity.ts          # TypeORM User entity
│   └── dto/
│       └── user-response.dto.ts    # Safe user output
├── posts/                          # Posts module
│   ├── posts.module.ts
│   ├── posts.controller.ts         # Post endpoints
│   ├── posts.service.ts            # Post business logic
│   ├── posts.service.spec.ts       # Unit tests
│   ├── posts.repository.ts         # Post data access
│   ├── entities/
│   │   └── post.entity.ts          # TypeORM Post entity
│   └── dto/
│       ├── create-post.dto.ts      # Create input
│       ├── update-post.dto.ts      # Update input
│       ├── find-posts.dto.ts       # Query parameters
│       └── post-response.dto.ts    # Post output
├── categories/                     # Categories module
│   ├── categories.module.ts
│   ├── categories.controller.ts    # Category endpoints
│   ├── categories.service.ts       # Category logic
│   ├── categories.service.spec.ts  # Unit tests
│   ├── categories.repository.ts    # Category data access
│   ├── entities/
│   │   └── category.entity.ts      # TypeORM Category entity
│   └── dto/
│       ├── create-category.dto.ts
│       └── category-response.dto.ts
├── comments/                       # Comments module
│   ├── comments.module.ts
│   ├── comments.controller.ts      # Comment endpoints
│   ├── comments.service.ts         # Comment logic
│   ├── comments.service.spec.ts    # Unit tests
│   ├── comments.repository.ts      # Comment data access
│   ├── entities/
│   │   └── comment.entity.ts       # TypeORM Comment entity
│   └── dto/
│       ├── create-comment.dto.ts
│       └── comment-response.dto.ts
├── common/                         # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # Extract user from request
│   │   └── roles.decorator.ts         # Role annotation
│   ├── dto/
│   │   └── pagination.dto.ts       # Base pagination
│   └── utils/
│       └── slug.util.ts            # Slug generation
├── config/                         # Environment configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── index.ts
├── database/                       # TypeORM setup
│   ├── database.module.ts
│   ├── data-source.ts              # TypeORM DataSource
│   └── migrations/                 # Database migrations
│       └── *.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts

test/
├── auth.e2e-spec.ts
├── posts.e2e-spec.ts
└── jest-e2e.json
```

---

## Design Patterns Required

### Beginner Level Patterns

- [x] **Repository Pattern** - Custom repositories abstract TypeORM from services
- [x] **Factory Pattern** - DTOs with constructors/static methods create response objects
- [x] **Singleton Pattern** - Services are singleton instances (NestJS default)
- [x] **Decorator Pattern** - `@CurrentUser()`, `@Roles()`, `@UseGuards()` for cross-cutting concerns

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, protect routes

**Contains:**
- Controllers (auth, posts, categories, comments)
- DTOs for request/response
- Guards (JWT, Roles)
- Custom decorators

**Endpoints:**
```
# Auth
POST /auth/register     # Register (author or reader role)
POST /auth/login        # Login, get token

# Posts
GET    /posts           # List published posts (public)
GET    /posts/:slug     # Get post with comments (public)
POST   /posts           # Create post (author only)
PUT    /posts/:id       # Update post (author + owner)
DELETE /posts/:id       # Soft delete (author + owner)

# Categories
GET    /categories      # List all categories
POST   /categories      # Create category (author only)

# Comments
POST   /posts/:id/comments  # Add comment (authenticated)
```

**Rules:**
- NO business logic
- NO direct database access
- Validate all input with class-validator
- Apply appropriate guards

### Business Layer

**Purpose:** Implement business logic, enforce authorization

**Contains:**
- `auth.service.ts` - Registration, login, token generation
- `posts.service.ts` - Post CRUD, slug generation, ownership
- `categories.service.ts` - Category management
- `comments.service.ts` - Comment creation

**Responsibilities:**
- Password hashing (bcrypt, 10 rounds)
- JWT token generation
- Role-based authorization (author vs reader)
- Resource ownership validation
- Unique slug generation
- Soft delete

**Rules:**
- NO HTTP/infrastructure concerns
- Enforce business rules
- Throw appropriate exceptions

### Data Access Layer

**Purpose:** Abstract TypeORM operations

**Contains:**
- `*.repository.ts` - Custom repository classes
- `*.entity.ts` - TypeORM entity definitions
- `data-source.ts` - Database connection config

**Responsibilities:**
- CRUD operations with TypeORM
- Query building (relations, filters)
- Soft delete with @DeleteDateColumn
- Pagination with skip/take

**Rules:**
- NO business logic
- Handle TypeORM-specific operations
- Use QueryBuilder for complex queries

---

## Entity Definitions (TypeORM)

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

enum UserRole {
  AUTHOR = 'author',
  READER = 'reader',
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
  deletedAt: Date;  // Soft delete
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

---

## Role-Based Access Control (RBAC)

### User Roles

```
┌─────────────┐        ┌─────────────┐
│   READER    │        │   AUTHOR    │
├─────────────┤        ├─────────────┤
│ View posts  │        │ All reader  │
│ Add comments│        │ + Create    │
│             │        │ + Edit own  │
│             │        │ + Delete own│
└─────────────┘        └─────────────┘
```

### Implementation

```typescript
// roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage in controller
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AUTHOR)
async create(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
  return this.postsService.create(dto, user.id);
}
```

---

## Slug Generation Pattern

### Implementation

```typescript
// slug.util.ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// posts.service.ts
async create(dto: CreatePostDto, authorId: string): Promise<Post> {
  let slug = generateSlug(dto.title);

  // Ensure uniqueness
  const existing = await this.postsRepository.findBySlug(slug);
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  return this.postsRepository.create({
    ...dto,
    slug,
    authorId,
  });
}
```

---

## TypeORM Soft Delete

### Configuration

```typescript
@Entity('posts')
export class Post {
  // ... other columns

  @DeleteDateColumn()
  deletedAt: Date;
}
```

### Usage

```typescript
// Soft delete - sets deletedAt, doesn't remove row
await this.postsRepository.softDelete(id);

// Queries automatically exclude soft-deleted records
// Use withDeleted() to include them
const allPosts = await this.postsRepository
  .createQueryBuilder('post')
  .withDeleted()
  .getMany();
```

---

## TypeORM Relations & Loading

### Eager vs Lazy Loading

```typescript
// Explicit relation loading in repository
async findBySlugWithRelations(slug: string): Promise<Post> {
  return this.repository.findOne({
    where: { slug },
    relations: ['author', 'category', 'comments', 'comments.user'],
  });
}

// QueryBuilder for complex queries
async findPublishedWithPagination(query: FindPostsDto) {
  return this.repository
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.category', 'category')
    .where('post.published = :published', { published: true })
    .orderBy('post.createdAt', 'DESC')
    .skip((query.page - 1) * query.limit)
    .take(query.limit)
    .getManyAndCount();
}
```

---

## Error Handling

### Standard NestJS Exceptions

```typescript
// Post not found
throw new NotFoundException('Post not found');

// Not the author of the post
throw new ForbiddenException('Cannot edit other user\'s post');

// Reader trying to create post
throw new ForbiddenException('Only authors can create posts');

// Category not found when creating post
throw new NotFoundException('Category not found');

// Invalid credentials
throw new UnauthorizedException('Invalid credentials');
```

---

## Module Wiring

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    CategoriesModule,
    UsersModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService],
})
export class PostsModule {}
```

---

## Architecture Checklist

### Beginner Level Requirements

#### Presentation Layer
- [x] Auth controller (register, login)
- [x] Posts controller (CRUD)
- [x] Categories controller (list, create)
- [x] Comments controller (create)
- [x] DTOs for all endpoints
- [x] Input validation (class-validator)
- [x] JWT guard for protected routes
- [x] Roles guard for authorization
- [x] Swagger documentation

#### Business Layer
- [x] Auth service (registration, login)
- [x] Posts service with ownership validation
- [x] Categories service
- [x] Comments service
- [x] Slug generation
- [x] Soft delete implementation

#### Data Access Layer
- [x] Custom repositories (TypeORM)
- [x] Entity definitions with decorators
- [x] Relations (@ManyToOne, @OneToMany)
- [x] Soft delete (@DeleteDateColumn)
- [x] Database migrations

#### Cross-Cutting
- [x] JWT Authentication
- [x] Role-based authorization (RBAC)
- [x] Resource ownership validation
- [x] Validation (DTOs)
- [x] Error handling (Standard NestJS)
- [x] Configuration (ConfigModule)

#### Testing
- [x] Service unit tests
- [x] E2E tests

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| Auth endpoints | `src/auth/auth.controller.ts` |
| Auth logic | `src/auth/auth.service.ts` |
| Post endpoints | `src/posts/posts.controller.ts` |
| Post logic | `src/posts/posts.service.ts` |
| Post data access | `src/posts/posts.repository.ts` |
| Post entity | `src/posts/entities/post.entity.ts` |
| Migrations | `src/database/migrations/` |
| DataSource config | `src/database/data-source.ts` |
| Slug utility | `src/common/utils/slug.util.ts` |
| Role decorator | `src/common/decorators/roles.decorator.ts` |

---

## TypeORM Commands

```bash
# Generate migration from entity changes
pnpm run typeorm migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
pnpm run typeorm migration:run

# Revert last migration
pnpm run typeorm migration:revert
```

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Storage | bcrypt (10 rounds) |
| Access Token | JWT with expiration |
| Route Protection | JwtAuthGuard |
| Role Authorization | RolesGuard + @Roles() decorator |
| Resource Ownership | authorId check in service |
| Input Validation | class-validator whitelist |
| Soft Delete | @DeleteDateColumn preserves data |

---

**Last updated:** 2026-01-11
