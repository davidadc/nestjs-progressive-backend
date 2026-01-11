# ARCHITECTURE.md - User Authentication API

## Project Architecture Overview

**Project:** User Authentication API
**Level:** Beginner
**Architecture Style:** Modular 3-Layer
**ORM:** Prisma 7 (with @prisma/adapter-pg)

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
│  (Repositories, Entities, Prisma)       │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Controller → Service → Repository → Database
```

---

## Folder Structure

```
src/
├── auth/                         # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts        # Auth endpoints (register, login, refresh, logout)
│   ├── auth.service.ts           # Auth business logic
│   ├── auth.service.spec.ts      # Unit tests
│   ├── dto/
│   │   ├── register.dto.ts       # Registration input
│   │   ├── login.dto.ts          # Login input
│   │   ├── logout.dto.ts         # Logout input
│   │   ├── refresh-token.dto.ts  # Token refresh input
│   │   └── auth-response.dto.ts  # Auth response output
│   ├── guards/
│   │   └── jwt-auth.guard.ts     # JWT protection guard
│   └── strategies/
│       └── jwt.strategy.ts       # Passport JWT strategy
├── users/                        # Users module
│   ├── users.module.ts
│   ├── users.service.ts          # User business logic
│   ├── users.service.spec.ts     # Unit tests
│   ├── users.repository.ts       # Prisma data access
│   ├── entities/
│   │   └── user.entity.ts        # User type definition
│   └── dto/
│       └── user-response.dto.ts  # Safe user output (no password)
├── common/                       # Shared utilities
│   └── decorators/
│       ├── current-user.decorator.ts  # Extract user from request
│       └── index.ts
├── config/                       # Environment configuration
│   ├── app.config.ts             # App settings
│   ├── database.config.ts        # Database settings
│   ├── jwt.config.ts             # JWT settings
│   └── index.ts
├── prisma/                       # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma                 # Database schema

test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

---

## Design Patterns Required

### Beginner Level Patterns

- [x] **Repository Pattern** - `UsersRepository` abstracts Prisma from business logic
- [x] **Factory Pattern** - `UserResponseDto` constructor creates safe user objects (excludes password)
- [x] **Singleton Pattern** - Configuration services are singleton instances (NestJS default)
- [x] **Decorator Pattern** - `@CurrentUser()` extracts authenticated user from request

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, format responses

**Contains:**
- `auth.controller.ts` - Auth endpoints (register, login, refresh, profile, logout)
- DTOs in `auth/dto/` and `users/dto/` - Request/response shapes
- `jwt-auth.guard.ts` - Route protection
- `jwt.strategy.ts` - Token validation

**Rules:**
- NO business logic
- NO direct database access
- Validate all input with class-validator
- Transform responses to DTOs

### Business Layer

**Purpose:** Implement authentication logic and coordinate data access

**Contains:**
- `auth.service.ts` - Registration, login, token management, logout
- `users.service.ts` - User operations

**Responsibilities:**
- Password hashing with bcrypt (10 rounds)
- JWT token generation (access + refresh tokens)
- Token rotation on refresh
- Token revocation on logout
- Email uniqueness validation

**Rules:**
- NO HTTP/infrastructure concerns
- Coordinate with repository layer
- Throw appropriate NestJS exceptions

### Data Access Layer

**Purpose:** Abstract database operations behind clean interfaces

**Contains:**
- `users.repository.ts` - Prisma operations for User and RefreshToken
- `prisma.service.ts` - Database connection management

**Rules:**
- NO business logic
- Handle Prisma-specific operations
- Return domain entities

---

## Authentication Flow

### Token Strategy

```
┌─────────────┐        ┌─────────────┐
│ Access Token│        │Refresh Token│
├─────────────┤        ├─────────────┤
│ TTL: 15 min │        │ TTL: 7 days │
│ Stateless   │        │ In Database │
│ In Memory   │        │ Rotated     │
└─────────────┘        └─────────────┘
```

### Registration Flow
```
1. Validate input (RegisterDto)
2. Check email uniqueness
3. Hash password (bcrypt, 10 rounds)
4. Create user in database
5. Generate access token (15 min) + refresh token (7 days)
6. Store refresh token in database
7. Return tokens + user data
```

### Login Flow
```
1. Validate credentials (LoginDto)
2. Find user by email
3. Compare password with bcrypt
4. Generate new token pair
5. Store refresh token
6. Return tokens + user data
```

### Token Refresh Flow
```
1. Validate refresh token exists in database
2. Check expiration
3. Delete old refresh token (rotation)
4. Generate new token pair
5. Store new refresh token
6. Return new tokens
```

---

## Mapper Pattern

### UserResponseDto (Safe User Output)

```typescript
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  // Note: password is NEVER included

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}
```

---

## Error Handling

### Standard NestJS Exceptions

```typescript
// User not found
throw new NotFoundException('User not found');

// Invalid credentials
throw new UnauthorizedException('Invalid credentials');

// Email already exists
throw new ConflictException('Email already registered');

// Invalid refresh token
throw new UnauthorizedException('Invalid or expired refresh token');
```

---

## Module Wiring

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRATION') },
      }),
    }),
    PassportModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

---

## Architecture Checklist

### Beginner Level Requirements

#### Presentation Layer
- [x] Controllers with proper routing
- [x] DTOs for all endpoints
- [x] Input validation (class-validator)
- [x] Guards for protected routes
- [x] Swagger documentation

#### Business Layer
- [x] Services with business logic
- [x] Password hashing (bcrypt)
- [x] JWT token generation
- [x] Token refresh mechanism
- [x] Token revocation (logout)

#### Data Access Layer
- [x] Repository implementation (Prisma)
- [x] Entity definitions
- [x] Refresh token storage

#### Cross-Cutting
- [x] Authentication (JWT)
- [x] Validation (DTOs)
- [x] Error handling (Standard NestJS)
- [x] Configuration (ConfigModule)

#### Testing
- [x] Unit tests (80%+ coverage)
- [ ] E2E tests

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| Auth endpoints | `src/auth/auth.controller.ts` |
| Auth business logic | `src/auth/auth.service.ts` |
| User data access | `src/users/users.repository.ts` |
| Token validation | `src/auth/strategies/jwt.strategy.ts` |
| Request DTOs | `src/auth/dto/` |
| Response DTOs | `src/users/dto/user-response.dto.ts` |
| Database schema | `prisma/schema.prisma` |
| Environment config | `src/config/` |

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Storage | bcrypt with 10 rounds |
| Access Token | JWT, 15 min expiry |
| Refresh Token | UUID, 7 days expiry, stored in DB |
| Token Rotation | New refresh token on each refresh |
| Token Revocation | Delete from DB on logout |
| Input Validation | class-validator whitelist |

---

**Last updated:** 2026-01-11
