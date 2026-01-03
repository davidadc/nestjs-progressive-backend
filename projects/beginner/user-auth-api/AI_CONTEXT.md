# User Authentication API - AI Context

**Project:** user-auth-api
**Level:** Beginner
**ORM:** Prisma 7 (with @prisma/adapter-pg)
**Status:** Complete

---

## Architecture

```
src/
├── auth/                      # Authentication feature module
│   ├── auth.module.ts         # Module definition
│   ├── auth.controller.ts     # HTTP endpoints
│   ├── auth.service.ts        # Business logic
│   ├── dto/                   # Data transfer objects
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts  # Route protection
│   └── strategies/
│       └── jwt.strategy.ts    # Passport JWT strategy
├── users/                     # Users feature module
│   ├── users.module.ts
│   ├── users.service.ts       # User business logic
│   ├── users.repository.ts    # Prisma data access
│   ├── entities/
│   │   └── user.entity.ts     # User type definition
│   └── dto/
│       └── user-response.dto.ts
├── common/                    # Shared utilities
│   └── decorators/
│       └── current-user.decorator.ts
├── config/                    # Environment configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
├── prisma/                    # Database service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

---

## Patterns Used

1. **Repository Pattern** - UsersRepository abstracts Prisma from business logic
2. **Factory Pattern** - UserResponseDto constructor creates safe user objects
3. **Decorator Pattern** - @CurrentUser() extracts user from request
4. **Singleton Pattern** - Configuration services are singleton instances

---

## Database Schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String         # bcrypt hashed
  name          String
  role          Role           @default(USER)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(...)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

---

## Authentication Flow

### Registration
1. Validate input (RegisterDto)
2. Check if email exists
3. Hash password with bcrypt (10 rounds)
4. Create user in database
5. Generate access token (15 min) and refresh token (7 days)
6. Store refresh token in database
7. Return tokens and user data

### Login
1. Validate input (LoginDto)
2. Find user by email
3. Compare password with bcrypt
4. Generate new token pair
5. Store refresh token
6. Return tokens and user data

### Token Refresh
1. Validate refresh token exists in database
2. Check expiration
3. Delete old refresh token (rotation)
4. Generate new token pair
5. Store new refresh token
6. Return new tokens

### Logout
1. Delete refresh token(s) from database
2. Client discards access token

---

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days and are rotated on use
- Refresh tokens stored in database (revocable)
- Password never returned in responses
- ValidationPipe whitelist strips unknown properties

---

## Key Files to Reference

| Purpose | File |
|---------|------|
| Auth business logic | `src/auth/auth.service.ts` |
| Auth endpoints | `src/auth/auth.controller.ts` |
| JWT validation | `src/auth/strategies/jwt.strategy.ts` |
| User data access | `src/users/users.repository.ts` |
| Database schema | `prisma/schema.prisma` |
| Environment vars | `.env.example` |

---

## Commands

```bash
# Development
pnpm run start:dev         # Start with hot reload

# Testing
pnpm run test              # Run unit tests
pnpm run test:cov          # Run with coverage

# Database
npx prisma migrate dev     # Run migrations
npx prisma studio          # Open Prisma Studio

# Build
pnpm run build             # Production build
pnpm run start:prod        # Production start
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for signing tokens | - |
| JWT_ACCESS_EXPIRATION | Access token TTL (seconds) | 900 |
| JWT_REFRESH_EXPIRATION | Refresh token TTL (seconds) | 604800 |
| PORT | Server port | 3000 |

---

## Endpoints Summary

```
POST /auth/register     # Register new user
POST /auth/login        # Login with credentials
POST /auth/refresh      # Refresh access token
GET  /auth/profile      # Get current user (protected)
POST /auth/logout       # Logout (protected)
```

Swagger documentation available at `/docs` when running.
