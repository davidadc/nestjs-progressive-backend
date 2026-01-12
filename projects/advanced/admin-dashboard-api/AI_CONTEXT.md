# AI_CONTEXT.md - Context for Claude Code

## Project Information

**Name:** Admin Dashboard API
**Level:** Advanced
**Description:** Backend for admin dashboard with analytics, user management, content moderation, and comprehensive audit logging
**ORM:** TypeORM
**Stack:** NestJS + TypeScript + PostgreSQL + TypeORM + Redis

---

## Project Structure

### Advanced Level (Modular + Full DDD)

```
src/
├── auth/                            # Auth feature module
│   ├── auth.module.ts
│   ├── domain/
│   │   ├── value-objects/
│   │   │   └── role.vo.ts
│   │   └── exceptions/
│   │       └── auth.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   └── login.command.ts
│   │   ├── dto/
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
├── users/                           # Users management module
│   ├── users.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── user.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── user-id.vo.ts
│   │   │   ├── email.vo.ts
│   │   │   └── role.vo.ts
│   │   ├── events/
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-role-changed.event.ts
│   │   │   └── user-deactivated.event.ts
│   │   ├── repositories/
│   │   │   └── user.repository.interface.ts
│   │   └── exceptions/
│   │       └── user.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-user.command.ts
│   │   │   ├── change-user-role.command.ts
│   │   │   └── deactivate-user.command.ts
│   │   ├── queries/
│   │   │   ├── get-user.query.ts
│   │   │   └── list-users.query.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user-role.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── event-handlers/
│   │   │   └── user-events.handler.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── admin-users.controller.ts
│       └── persistence/
│           ├── user.entity.ts
│           └── user.repository.ts
│
├── content/                         # Content moderation module
│   ├── content.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── content.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── content-id.vo.ts
│   │   │   └── content-status.vo.ts
│   │   ├── events/
│   │   │   ├── content-submitted.event.ts
│   │   │   ├── content-approved.event.ts
│   │   │   └── content-rejected.event.ts
│   │   ├── repositories/
│   │   │   └── content.repository.interface.ts
│   │   └── exceptions/
│   │       └── content.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── approve-content.command.ts
│   │   │   └── reject-content.command.ts
│   │   ├── queries/
│   │   │   ├── get-content.query.ts
│   │   │   └── list-pending-content.query.ts
│   │   ├── dto/
│   │   │   ├── content-response.dto.ts
│   │   │   └── moderate-content.dto.ts
│   │   ├── event-handlers/
│   │   │   └── content-events.handler.ts
│   │   └── mappers/
│   │       └── content.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── admin-content.controller.ts
│       └── persistence/
│           ├── content.entity.ts
│           └── content.repository.ts
│
├── audit/                           # Audit logging module
│   ├── audit.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── audit-log.entity.ts
│   │   ├── value-objects/
│   │   │   └── audit-action.vo.ts
│   │   └── repositories/
│   │       └── audit-log.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   └── create-audit-log.command.ts
│   │   ├── queries/
│   │   │   └── list-audit-logs.query.ts
│   │   ├── dto/
│   │   │   └── audit-log-response.dto.ts
│   │   ├── services/
│   │   │   └── audit.service.ts
│   │   └── mappers/
│   │       └── audit-log.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── admin-audit.controller.ts
│       ├── persistence/
│       │   ├── audit-log.entity.ts
│       │   └── audit-log.repository.ts
│       └── interceptors/
│           └── audit.interceptor.ts
│
├── dashboard/                       # Dashboard & analytics module
│   ├── dashboard.module.ts
│   ├── application/
│   │   ├── queries/
│   │   │   ├── get-dashboard-stats.query.ts
│   │   │   └── get-reports.query.ts
│   │   ├── dto/
│   │   │   ├── dashboard-stats.dto.ts
│   │   │   └── report-response.dto.ts
│   │   └── services/
│   │       └── analytics.service.ts
│   └── infrastructure/
│       └── controllers/
│           └── admin-dashboard.controller.ts
│
├── common/
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── problem-details.filter.ts
│   ├── guards/
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── pipes/
│   └── exceptions/
│       ├── problem-details.exception.ts
│       └── problem-details.factory.ts
│
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── app.module.ts
└── main.ts

test/
├── users/
│   └── users.service.spec.ts
├── content/
│   └── content.service.spec.ts
├── audit/
│   └── audit.service.spec.ts
└── app.e2e-spec.ts
```

---

## Architecture

### Advanced (5+ layers with DDD + CQRS)

```
Controller → Command/Query Handler → Domain (Aggregates) → Repository
                    ↓
             Domain Events → Event Handlers (Audit, Notifications)
```

**Patterns Used:**

- Repository Pattern (data access abstraction)
- Factory Pattern (entity creation)
- Decorator Pattern (roles, current user)
- Observer Pattern (domain events)
- State Pattern (content moderation states)
- Strategy Pattern (report generation)
- Mediator Pattern (CQRS - CommandBus/QueryBus)
- Domain Events (audit logging, notifications)

**Flow:**

```
HTTP Request
    ↓
Controller (validates request, extracts user context)
    ↓
CommandBus / QueryBus (CQRS)
    ↓
Command/Query Handler (orchestrates domain logic)
    ↓
Aggregate Root (enforces business invariants)
    ↓
Repository (persists changes)
    ↓
Domain Events → Event Handlers (audit log, notifications)
```

---

## Entities

### User Aggregate

```typescript
export class User extends AggregateRoot {
  id: UserId;
  email: Email;
  name: string;
  password: string; // hashed
  role: Role; // super_admin | admin | manager | support
  status: UserStatus; // active | inactive | suspended
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Content Aggregate

```typescript
export class Content extends AggregateRoot {
  id: ContentId;
  title: string;
  body: string;
  authorId: string;
  status: ContentStatus; // pending | approved | rejected
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AuditLog Entity

```typescript
export class AuditLog {
  id: string;
  action: AuditAction; // user.created | user.role_changed | content.approved | etc.
  entityType: string; // User | Content
  entityId: string;
  performedBy: string; // userId
  performedByRole: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
```

### Value Objects

- **UserId**: UUID wrapper with validation
- **Email**: Email with format validation
- **Role**: Enum (super_admin | admin | manager | support)
- **ContentStatus**: Enum with state transitions
- **AuditAction**: Categorized action types

### DTOs

**CreateUserDto** (input)
- email: string (required, valid email)
- name: string (required, min 2 chars)
- password: string (required, min 8 chars)
- role: Role (required)

**UserResponseDto** (output)
- id: string
- email: string
- name: string
- role: string
- status: string
- lastLoginAt?: Date
- createdAt: Date

**DashboardStatsDto** (output)
- totalUsers: number
- activeUsers: number
- pendingContent: number
- approvedContentToday: number
- recentActivity: AuditLogResponseDto[]

---

## Security Requirements

### Authentication

- [x] JWT tokens with refresh mechanism
- [x] Password hashing (bcrypt, 10 rounds)
- [x] Rate limiting on login endpoint

### Authorization (RBAC)

```typescript
// Role hierarchy
super_admin > admin > manager > support

// Permissions matrix
| Action              | Super Admin | Admin | Manager | Support |
|---------------------|-------------|-------|---------|---------|
| View dashboard      | ✓           | ✓     | ✓       | ✓       |
| View users          | ✓           | ✓     | ✓       | ✓       |
| Create users        | ✓           | ✓     | ✗       | ✗       |
| Change user roles   | ✓           | ✓*    | ✗       | ✗       |
| Deactivate users    | ✓           | ✓*    | ✗       | ✗       |
| View content        | ✓           | ✓     | ✓       | ✓       |
| Moderate content    | ✓           | ✓     | ✗       | ✓       |
| View audit logs     | ✓           | ✓     | ✓       | ✗       |
| View reports        | ✓           | ✓     | ✓       | ✗       |

* Admin cannot modify super_admin users
```

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization
- [x] UUID validation for IDs

### Error Handling (RFC 7807)

- [x] Problem Details format for all errors
- [x] No stack traces in production
- [x] Security event logging
- [x] Masked sensitive data in audit logs

---

## Endpoints

### Authentication

#### POST /api/v1/auth/login

**Description:** Admin login

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Success (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

**Error (401) - RFC 7807:**
```json
{
  "type": "https://api.example.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid credentials",
  "instance": "POST /api/v1/auth/login",
  "timestamp": "2026-01-12T10:00:00Z"
}
```

### Dashboard

#### GET /api/v1/admin/dashboard/stats

**Description:** Get dashboard statistics

**Success (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 142,
    "usersByRole": {
      "admin": 5,
      "manager": 15,
      "support": 30,
      "user": 100
    },
    "pendingContent": 12,
    "approvedContentToday": 45,
    "recentActivity": [...]
  }
}
```

### User Management

#### GET /api/v1/admin/users

**Description:** List all users with pagination and filters

**Query Parameters:**
- page: number (default: 1)
- limit: number (default: 20)
- role: string (filter by role)
- status: string (filter by status)
- search: string (search by name/email)

**Success (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### PATCH /api/v1/admin/users/:id/role

**Description:** Change user role

**Request:**
```json
{
  "role": "manager"
}
```

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "manager"
  }
}
```

**Error (403) - RFC 7807:**
```json
{
  "type": "https://api.example.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Cannot modify role of a super_admin user",
  "instance": "PATCH /api/v1/admin/users/uuid/role"
}
```

#### DELETE /api/v1/admin/users/:id

**Description:** Deactivate user (soft delete)

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "inactive"
  }
}
```

### Content Moderation

#### GET /api/v1/admin/content

**Description:** List content for moderation

**Query Parameters:**
- status: pending | approved | rejected
- page, limit

#### PATCH /api/v1/admin/content/:id/approve

**Description:** Approve content

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "moderatedBy": "admin-uuid",
    "moderatedAt": "2026-01-12T10:00:00Z"
  }
}
```

#### PATCH /api/v1/admin/content/:id/reject

**Description:** Reject content

**Request:**
```json
{
  "reason": "Violates community guidelines"
}
```

### Audit Logs

#### GET /api/v1/admin/audit-log

**Description:** View audit logs

**Query Parameters:**
- action: string (filter by action type)
- entityType: string (User | Content)
- performedBy: string (userId)
- startDate, endDate: ISO dates
- page, limit

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "user.role_changed",
      "entityType": "User",
      "entityId": "user-uuid",
      "performedBy": "admin-uuid",
      "performedByName": "Admin User",
      "previousValue": { "role": "support" },
      "newValue": { "role": "manager" },
      "timestamp": "2026-01-12T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Reports

#### GET /api/v1/admin/reports

**Description:** Generate reports

**Query Parameters:**
- type: users | content | activity
- format: json | csv
- startDate, endDate

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('ChangeUserRoleHandler', () => {
  describe('execute', () => {
    it('should change user role successfully');
    it('should throw when user not found');
    it('should throw when trying to modify super_admin');
    it('should emit UserRoleChangedEvent');
    it('should create audit log entry');
  });
});

describe('ApproveContentHandler', () => {
  describe('execute', () => {
    it('should approve pending content');
    it('should throw when content already approved');
    it('should throw when content not found');
    it('should emit ContentApprovedEvent');
  });
});
```

### E2E Tests

```typescript
describe('Admin Users API (e2e)', () => {
  describe('GET /api/v1/admin/users', () => {
    it('should return paginated users for admin');
    it('should return 401 for unauthenticated');
    it('should return 403 for insufficient role');
  });

  describe('PATCH /api/v1/admin/users/:id/role', () => {
    it('should change role for valid request');
    it('should return 403 when modifying super_admin');
    it('should create audit log entry');
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

### ORM (TypeORM)

```json
{
  "typeorm": "^0.3.0",
  "@nestjs/typeorm": "^10.0.0",
  "pg": "^8.11.0"
}
```

### Authentication

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0"
}
```

### Project-Specific

```json
{
  "@nestjs/swagger": "^7.0.0",
  "@nestjs/throttler": "^5.0.0",
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
DATABASE_NAME=admin_dashboard_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=900
JWT_REFRESH_EXPIRATION=604800

# Redis (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379

# App
NODE_ENV=development
PORT=3000
```

---

## Code Conventions

### Naming

- Controllers: `admin-*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities (ORM): `*.entity.ts`
- Aggregates: `*.aggregate.ts`
- Value Objects: `*.vo.ts`
- Commands: `*.command.ts`
- Queries: `*.query.ts`
- Events: `*.event.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation
- RFC 7807 for all errors

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder structure for Admin Dashboard API with Advanced DDD + CQRS architecture"
```

### 2. Common Module

```
"Implement common module with AggregateRoot, ValueObject base classes, and RFC 7807 Problem Details"
```

### 3. Auth Module

```
"Implement auth module with JWT authentication and role-based guards"
```

### 4. Users Module

```
"Implement users module with CQRS (commands, queries), domain events, and audit logging"
```

### 5. Content Module

```
"Implement content moderation module with State pattern for content status transitions"
```

### 6. Audit Module

```
"Implement audit module with interceptor for automatic action logging"
```

### 7. Dashboard Module

```
"Implement dashboard module with analytics queries and report generation"
```

### 8. Testing

```
"Create unit tests for command handlers and e2e tests for admin endpoints"
```

---

## Learning Goals

Upon completing this project:

- [ ] Understand DDD concepts (Aggregates, Value Objects, Domain Events)
- [ ] Implement CQRS pattern with CommandBus/QueryBus
- [ ] Build comprehensive RBAC system with role hierarchy
- [ ] Create audit logging system with automatic tracking
- [ ] Use RFC 7807 Problem Details for consistent error handling
- [ ] Build content moderation workflow with state management
- [ ] Generate analytics and reports from aggregated data

---

## Next Steps

After completion:

1. Add real-time dashboard updates with WebSockets
2. Implement advanced analytics with time-series data
3. Add export functionality (PDF reports, CSV exports)
4. Implement two-factor authentication for admin accounts

Then proceed to: **Expert Level - Microservices Architecture**

---

## Quick Reference

**Where does X go? (Advanced Level)**

- Business logic → `src/{{module}}/domain/aggregates/` + `src/{{module}}/application/commands/`
- DTOs → `src/{{module}}/application/dto/`
- Database access → `src/{{module}}/infrastructure/persistence/`
- Endpoints → `src/{{module}}/infrastructure/controllers/`
- Domain entities → `src/{{module}}/domain/aggregates/` + `src/{{module}}/domain/value-objects/`
- Events → `src/{{module}}/domain/events/` + `src/{{module}}/application/event-handlers/`

**TypeORM Commands:**

```bash
pnpm run typeorm migration:generate -- --name MigrationName
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

---

**Last updated:** 2026-01-12
**To use:** Run `claude code` from project root
