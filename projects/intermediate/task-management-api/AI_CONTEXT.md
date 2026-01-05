# AI_CONTEXT.md - Context for Claude Code

---

## Project Information

**Name:** Task Management API
**Level:** Intermediate
**Description:** Task management system with RBAC, project organization, task assignments, and commenting
**ORM:** Prisma
**Stack:** NestJS + TypeScript + PostgreSQL + Prisma + JWT + Redis (optional caching)

---

## Project Structure

### Intermediate Level (Modular + Clean Architecture)

```
src/
├── auth/                          # Authentication module
│   ├── auth.module.ts
│   ├── domain/
│   │   └── entities/
│   ├── application/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   └── services/
│   │       └── auth.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   └── roles.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── users/                         # Users module
│   ├── users.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── users.controller.ts
│       └── persistence/
│           └── user.repository.ts
│
├── projects/                      # Projects module
│   ├── projects.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── project.entity.ts
│   │   ├── repositories/
│   │   │   └── project.repository.interface.ts
│   │   └── exceptions/
│   │       └── project.exceptions.ts
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   │   └── projects.service.ts
│   │   ├── use-cases/
│   │   │   ├── create-project.use-case.ts
│   │   │   └── add-member.use-case.ts
│   │   └── mappers/
│   │       └── project.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── projects.controller.ts
│       ├── guards/
│       │   └── project-owner.guard.ts
│       └── persistence/
│           └── project.repository.ts
│
├── tasks/                         # Tasks module
│   ├── tasks.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── task.entity.ts
│   │   ├── repositories/
│   │   │   └── task.repository.interface.ts
│   │   ├── enums/
│   │   │   ├── task-status.enum.ts
│   │   │   └── task-priority.enum.ts
│   │   ├── events/
│   │   │   └── task-status-changed.event.ts
│   │   └── exceptions/
│   │       └── task.exceptions.ts
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   │   └── tasks.service.ts
│   │   ├── use-cases/
│   │   │   ├── create-task.use-case.ts
│   │   │   ├── assign-task.use-case.ts
│   │   │   └── update-task-status.use-case.ts
│   │   └── mappers/
│   │       └── task.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── tasks.controller.ts
│       ├── guards/
│       │   └── task-access.guard.ts
│       └── persistence/
│           └── task.repository.ts
│
├── comments/                      # Comments module
│   ├── comments.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── common/                        # Shared utilities
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── api-paginated-response.decorator.ts
│   ├── dto/
│   │   ├── base-response.dto.ts
│   │   └── pagination.dto.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── validation-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── pipes/
│
├── config/                        # App configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── throttle.config.ts
│
├── prisma/                        # Prisma module
│   └── prisma.module.ts
│
├── app.module.ts
└── main.ts

test/
├── auth.e2e-spec.ts
├── projects.e2e-spec.ts
├── tasks.e2e-spec.ts
└── jest-e2e.json
```

---

## Architecture

### Intermediate (4 layers)

```
Controller → UseCase/Service → Domain → Repository
```

**Patterns Used:**

- Repository Pattern (data access abstraction)
- Strategy Pattern (task assignment flexibility)
- Observer Pattern (task status change events)
- Mapper Pattern (entity/DTO transformations)
- Use Case Pattern (business operation encapsulation)
- Guard Pattern (authorization checks)

**Flow:**

```
HTTP Request
    ↓
Controller (validates request, Swagger docs)
    ↓
Guard (authentication, authorization)
    ↓
UseCase / Service (business logic)
    ↓
Repository Interface (abstraction)
    ↓
Repository Implementation (Prisma)
    ↓
Database (PostgreSQL)
```

---

## Entities

### User Entity

```typescript
export class User {
  id: string;          // UUID
  email: string;       // unique
  name: string;
  password: string;    // hashed with bcrypt
  role: UserRole;      // 'admin' | 'manager' | 'user'
  createdAt: Date;
  updatedAt: Date;
}
```

### Project Entity

```typescript
export class Project {
  id: string;          // UUID
  name: string;
  description?: string;
  ownerId: string;     // FK -> User
  members: User[];     // Many-to-many
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Entity

```typescript
export class Task {
  id: string;          // UUID
  projectId: string;   // FK -> Project
  title: string;
  description?: string;
  status: TaskStatus;  // 'todo' | 'in_progress' | 'done'
  priority: TaskPriority; // 'low' | 'medium' | 'high'
  assignedToId?: string; // FK -> User (nullable)
  createdById: string; // FK -> User
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### TaskComment Entity

```typescript
export class TaskComment {
  id: string;          // UUID
  taskId: string;      // FK -> Task
  userId: string;      // FK -> User
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### DTOs

**CreateTaskDto** (input)
- title: string (required, 3-200 chars)
- description?: string (optional, max 1000 chars)
- priority: TaskPriority (default: 'medium')
- assignedToId?: string (optional UUID)
- dueDate?: string (optional ISO date)

**TaskResponseDto** (output)
- id: string
- title: string
- description?: string
- status: string
- priority: string
- assignedTo?: UserResponseDto
- createdBy: UserResponseDto
- project: { id, name }
- dueDate?: string
- createdAt: string
- updatedAt: string

---

## Security Requirements

### Authentication

- [x] JWT tokens with configurable expiration
- [x] Password hashing (bcrypt, 10 rounds)
- [x] Rate limiting (@nestjs/throttler)

### Authorization

- [x] Role-based access (RBAC): admin, manager, user
- [x] Resource ownership validation (projects, tasks)
- [x] Project membership checks

### RBAC Permissions Matrix

| Action | Admin | Manager | User |
|--------|-------|---------|------|
| Create Projects | Yes | No | No |
| Manage Project Members | Owner | No | No |
| Create Tasks | Yes | Yes (in projects) | No |
| Assign Tasks | Yes | Yes (in projects) | No |
| Update Task Status | Yes | Yes | Own tasks only |
| Delete Tasks | Yes | Yes (in projects) | No |
| Comment on Tasks | Yes | Yes | Yes (member) |

### Validation

- [x] DTOs with class-validator decorators
- [x] Input sanitization
- [x] UUID validation for IDs

### Error Handling

- [x] Consistent error response format
- [x] HttpExceptionFilter for all exceptions
- [x] No stack traces in production

---

## Endpoints

### POST /api/v1/auth/register

**Description:** Register a new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Success (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "jwt-token"
  }
}
```

### POST /api/v1/auth/login

**Description:** Authenticate and receive JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": { ... },
    "accessToken": "jwt-token"
  }
}
```

### GET /api/v1/tasks

**Description:** List tasks with filtering and pagination

**Query Parameters:**
- status: 'todo' | 'in_progress' | 'done'
- priority: 'low' | 'medium' | 'high'
- assignedTo: 'me' | userId
- projectId: uuid
- search: string
- sort: 'createdAt' | 'dueDate' | 'priority'
- order: 'asc' | 'desc'
- page: number (default: 1)
- limit: number (default: 10, max: 100)

**Success (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [...tasks],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  },
  "meta": {
    "timestamp": "2026-01-04T10:00:00Z"
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UnauthorizedException"
}
```

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('TasksService', () => {
  describe('create', () => {
    it('should create a task in a project');
    it('should throw error when project not found');
    it('should throw error when user not a member');
  });

  describe('updateStatus', () => {
    it('should update task status');
    it('should emit task.status.changed event');
    it('should throw error when not authorized');
  });
});
```

### E2E Tests

```typescript
describe('Tasks Endpoints', () => {
  describe('POST /api/v1/projects/:id/tasks', () => {
    it('should create task when manager');
    it('should return 403 when regular user');
    it('should return 404 when project not found');
  });

  describe('GET /api/v1/tasks', () => {
    it('should return paginated tasks');
    it('should filter by status');
    it('should filter by assignedTo=me');
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
  "@nestjs/platform-express": "^10.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### Authentication

```json
{
  "@nestjs/passport": "^10.0.0",
  "@nestjs/jwt": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.0",
  "bcrypt": "^5.1.0"
}
```

### Database (Prisma)

```json
{
  "@prisma/client": "^5.0.0"
}
// Dev: "prisma": "^5.0.0"
```

### Documentation & Security

```json
{
  "@nestjs/swagger": "^7.0.0",
  "@nestjs/throttler": "^5.0.0",
  "helmet": "^7.0.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_URL="postgresql://admin:admin@localhost:5432/task_management_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=900

# App
PORT=3000
NODE_ENV=development

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Guards: `*.guard.ts`
- Mappers: `*.mapper.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation
- Single quotes for strings

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for Task Management API with 4-layer Clean Architecture"
```

### 2. Domain Layer

```
"Implement User, Project, Task, TaskComment entities and repository interfaces"
```

### 3. Application Layer

```
"Implement DTOs, TasksService, and CreateTaskUseCase, AssignTaskUseCase"
```

### 4. Infrastructure Layer

```
"Implement TasksController with CRUD endpoints and TaskRepository using Prisma"
```

### 5. Testing

```
"Create unit tests for TasksService and E2E tests for TasksController"
```

---

## Learning Goals

Upon completing this project:

- [ ] Understand 4-layer Clean Architecture in NestJS
- [ ] Implement Role-Based Access Control (RBAC)
- [ ] Use Repository pattern with Prisma
- [ ] Create use-cases for complex business operations
- [ ] Implement Observer pattern with NestJS event emitter
- [ ] Build comprehensive API documentation with Swagger
- [ ] Write unit and E2E tests with mocked dependencies

---

## Next Steps

After completion:

1. Add real-time notifications with WebSockets
2. Implement task activity/history log
3. Add file attachments to tasks
4. Implement due date reminders

Then proceed to: **Chat App Backend** (Drizzle ORM)

---

## Quick Reference

**Where does X go? (Modular + Clean Architecture):**

- Business logic → `src/{module}/application/services/` or `src/{module}/application/use-cases/`
- DTOs → `src/{module}/application/dto/`
- Database access → `src/{module}/infrastructure/persistence/`
- Endpoints → `src/{module}/infrastructure/controllers/`
- Domain entities → `src/{module}/domain/entities/`
- Guards → `src/{module}/infrastructure/guards/` or `src/common/guards/`

**ORM Commands (Prisma):**

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev --name migration_name
pnpm exec prisma migrate reset  # WARNING: deletes data
pnpm exec prisma studio
```

---

**Last updated:** 2026-01-04
