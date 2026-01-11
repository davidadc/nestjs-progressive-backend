# ARCHITECTURE.md - Task Management API

## Project Architecture Overview

**Project:** Task Management API
**Level:** Intermediate
**Architecture Style:** Modular Clean Architecture (4-Layer)
**ORM:** Prisma

---

## Layer Structure

### Intermediate: 4-Layer Clean Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Guards)           │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Use Cases, DTOs, Mappers, Services)   │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Entities, Repository Interfaces,      │
│   Enums, Events, Exceptions)            │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, Guards, Config)         │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Guard → Controller → UseCase/Service → Domain → Repository → Database
```

---

## Folder Structure

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
│   └── interceptors/
│       └── response.interceptor.ts
│
├── config/                        # Configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── throttle.config.ts
│
├── prisma/                        # Prisma module
│   └── prisma.module.ts
│
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Intermediate Level Patterns

- [x] **Repository Pattern** - Abstract Prisma behind interfaces
- [x] **Strategy Pattern** - Task assignment strategies (direct, round-robin)
- [x] **Observer Pattern** - Task status change events (EventEmitter)
- [x] **Mapper Pattern** - Entity ↔ DTO transformations
- [x] **Use Case Pattern** - Complex operations (CreateTask, AssignTask)
- [x] **Guard Pattern** - Custom guards (ProjectOwner, TaskAccess)
- [x] **Factory Pattern** - Entity creation with validation

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, apply guards

**Contains:**
- Controllers with route handlers
- Guards (JWT, Roles, ProjectOwner, TaskAccess)
- Swagger documentation

**Rules:**
- NO business logic
- Apply guards before handlers
- Validate input with DTOs
- Return formatted responses

### Application Layer

**Purpose:** Orchestrate business operations

**Contains:**
- **Services** - CRUD and query operations
- **Use Cases** - Complex business operations
- **DTOs** - Request/response shapes
- **Mappers** - Entity ↔ DTO conversions

**Rules:**
- NO HTTP concerns
- Coordinate domain entities
- Emit events for side effects
- Call repository interfaces only

### Domain Layer

**Purpose:** Core business rules and entities

**Contains:**
- **Entities** - Business objects
- **Repository Interfaces** - Data access contracts
- **Enums** - TaskStatus, TaskPriority, UserRole
- **Events** - Domain events (TaskStatusChangedEvent)
- **Exceptions** - Domain-specific exceptions

**Rules:**
- NO framework dependencies
- Pure TypeScript
- Business validation

### Infrastructure Layer

**Purpose:** Technical implementations

**Contains:**
- Repository implementations (Prisma)
- Custom guards
- Configuration

**Rules:**
- Implement domain interfaces
- Handle Prisma specifics
- NO business logic

---

## Role-Based Access Control (RBAC)

### User Roles

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    ADMIN    │     │   MANAGER   │     │    USER     │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ All access  │     │ Create proj │     │ View tasks  │
│ Manage users│     │ Manage tasks│     │ Update own  │
│ System-wide │     │ In projects │     │ Comment     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Permissions Matrix

| Action | Admin | Manager | User |
|--------|-------|---------|------|
| Create Projects | Yes | No | No |
| Manage Project Members | Owner | No | No |
| Create Tasks | Yes | Yes (in projects) | No |
| Assign Tasks | Yes | Yes (in projects) | No |
| Update Task Status | Yes | Yes | Own tasks only |
| Delete Tasks | Yes | Yes (in projects) | No |
| Comment on Tasks | Yes | Yes | Yes (member) |

### Implementation

```typescript
// common/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// infrastructure/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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
@Roles(UserRole.ADMIN, UserRole.MANAGER)
async createTask(@Body() dto: CreateTaskDto) { ... }
```

---

## Observer Pattern (Event Emitter)

### Task Status Changed Event

```typescript
// domain/events/task-status-changed.event.ts
export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly previousStatus: TaskStatus,
    public readonly newStatus: TaskStatus,
    public readonly changedBy: string,
    public readonly changedAt: Date,
  ) {}
}
```

### Emitting Events

```typescript
// application/use-cases/update-task-status.use-case.ts
@Injectable()
export class UpdateTaskStatusUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(taskId: string, newStatus: TaskStatus, userId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findById(taskId);
    const previousStatus = task.status;

    task.updateStatus(newStatus);
    await this.taskRepository.save(task);

    // Emit event for observers
    this.eventEmitter.emit(
      'task.status.changed',
      new TaskStatusChangedEvent(taskId, previousStatus, newStatus, userId, new Date()),
    );

    return TaskMapper.toDto(task);
  }
}
```

### Listening to Events

```typescript
// notifications/listeners/task-status.listener.ts
@Injectable()
export class TaskStatusListener {
  @OnEvent('task.status.changed')
  handleTaskStatusChanged(event: TaskStatusChangedEvent) {
    // Send notification, update activity log, etc.
    console.log(`Task ${event.taskId} changed from ${event.previousStatus} to ${event.newStatus}`);
  }
}
```

---

## Use Case Pattern

### CreateTaskUseCase

```typescript
@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(projectId: string, dto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    // 1. Verify project exists and user is member
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }
    if (!project.hasMember(userId)) {
      throw new NotProjectMemberException(userId, projectId);
    }

    // 2. Create task
    const task = Task.create({
      projectId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      createdById: userId,
      assignedToId: dto.assignedToId,
      dueDate: dto.dueDate,
    });

    // 3. Persist and return
    await this.taskRepository.save(task);
    return TaskMapper.toDto(task);
  }
}
```

---

## Task State Machine

### Status Transitions

```
┌────────┐     ┌─────────────┐     ┌────────┐
│  TODO  │────>│ IN_PROGRESS │────>│  DONE  │
└────────┘     └─────────────┘     └────────┘
     ↑               │                  │
     └───────────────┴──────────────────┘
            (Can reopen)
```

### Domain Entity with Validation

```typescript
// domain/entities/task.entity.ts
export class Task {
  // ... properties

  updateStatus(newStatus: TaskStatus): void {
    // Validate transition
    if (this.status === TaskStatus.DONE && newStatus === TaskStatus.IN_PROGRESS) {
      // Allowed: reopening
    } else if (!this.isValidTransition(newStatus)) {
      throw new InvalidStatusTransitionException(this.status, newStatus);
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }

  private isValidTransition(newStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
      [TaskStatus.DONE]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    };
    return validTransitions[this.status].includes(newStatus);
  }
}
```

---

## Custom Guards

### ProjectOwnerGuard

```typescript
@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId;

    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project.ownerId === user.id || user.role === UserRole.ADMIN;
  }
}
```

### TaskAccessGuard

```typescript
@Injectable()
export class TaskAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const taskId = request.params.taskId;

    const task = await this.taskRepository.findById(taskId);

    // Admin can access all
    if (user.role === UserRole.ADMIN) return true;

    // Manager can access tasks in their projects
    if (user.role === UserRole.MANAGER) {
      return await this.isProjectMember(task.projectId, user.id);
    }

    // User can only access assigned tasks
    return task.assignedToId === user.id;
  }
}
```

---

## Response Envelope Format

```typescript
// Success
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 45, "pages": 5 },
  "meta": { "timestamp": "2026-01-04T10:00:00Z" }
}

// Error
{
  "success": false,
  "statusCode": 403,
  "error": {
    "message": "Not authorized to update this task",
    "code": "FORBIDDEN"
  }
}
```

---

## Architecture Checklist

### Intermediate Level Requirements

#### Domain Layer
- [x] Domain entities with behavior
- [x] Repository interfaces
- [x] Domain enums (TaskStatus, TaskPriority, UserRole)
- [x] Domain events (TaskStatusChangedEvent)
- [x] Domain exceptions

#### Application Layer
- [x] Use cases for complex operations
- [x] Services for queries
- [x] DTOs for all endpoints
- [x] Mappers for conversions

#### Infrastructure Layer
- [x] Repository implementations (Prisma)
- [x] Custom guards (ProjectOwner, TaskAccess)
- [x] Controllers with routing

#### Cross-Cutting
- [x] JWT Authentication
- [x] Role-based access (RBAC)
- [x] Rate limiting (@nestjs/throttler)
- [x] Response envelope format
- [x] Exception filters
- [x] Swagger documentation

#### Testing
- [x] Unit tests (80%+ coverage)
- [x] E2E tests
- [x] Mocked repositories

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| HTTP handling | `src/{module}/infrastructure/controllers/` |
| Business logic | `src/{module}/application/services/` or `use-cases/` |
| DTOs | `src/{module}/application/dto/` |
| Mappers | `src/{module}/application/mappers/` |
| Domain entities | `src/{module}/domain/entities/` |
| Enums | `src/{module}/domain/enums/` |
| Events | `src/{module}/domain/events/` |
| Repository interfaces | `src/{module}/domain/repositories/` |
| Repository implementations | `src/{module}/infrastructure/persistence/` |
| Custom guards | `src/{module}/infrastructure/guards/` |

---

## Prisma Commands

```bash
# Generate Prisma client
pnpm exec prisma generate

# Create and apply migration
pnpm exec prisma migrate dev --name migration_name

# Reset database (WARNING: deletes data)
pnpm exec prisma migrate reset

# Open Prisma Studio
pnpm exec prisma studio
```

---

**Last updated:** 2026-01-11
