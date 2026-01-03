# User Authentication API

A beginner-level NestJS REST API implementing JWT-based user authentication with access and refresh token rotation.

## Features

- User registration with email validation
- Login with JWT access tokens (15 min expiry)
- Refresh token rotation (7 day expiry, stored in database)
- Secure password hashing with bcrypt
- Protected profile endpoint
- Logout with token invalidation
- Swagger/OpenAPI documentation

## Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5
- **Database:** PostgreSQL 17
- **ORM:** Prisma 7 (with `@prisma/adapter-pg`)
- **Authentication:** Passport JWT
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI

## Architecture

```
src/
├── auth/                      # Authentication module
│   ├── auth.controller.ts     # HTTP endpoints
│   ├── auth.service.ts        # Business logic
│   ├── dto/                   # Data transfer objects
│   ├── guards/                # JWT auth guard
│   └── strategies/            # Passport JWT strategy
├── users/                     # Users module
│   ├── users.service.ts       # User operations
│   ├── users.repository.ts    # Prisma data access
│   ├── entities/              # User type definition
│   └── dto/                   # Response DTOs
├── common/                    # Shared utilities
│   └── decorators/            # @CurrentUser() decorator
├── config/                    # Environment configuration
├── prisma/                    # Database service
├── app.module.ts
└── main.ts
```

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 17+ (via Docker or local)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

From the monorepo root:

```bash
docker-compose up -d postgres
```

### 3. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Default values should work with Docker setup.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
pnpm run start:dev
```

### 6. Access Swagger documentation

Open http://localhost:3000/docs

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get tokens | No |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/profile` | Get current user profile | Yes |
| POST | `/auth/logout` | Logout and invalidate tokens | Yes |

## Authentication Flow

### Registration
1. User submits email, password, and name
2. Password is hashed with bcrypt (10 rounds)
3. User is created in database
4. Access token (15 min) and refresh token (7 days) are generated
5. Refresh token is stored in database

### Login
1. User submits email and password
2. Credentials are validated
3. New token pair is generated and returned

### Token Refresh
1. Client sends refresh token
2. Token is validated against database
3. Old refresh token is deleted (rotation)
4. New token pair is generated and returned

### Logout
- Without body: Invalidates all refresh tokens for the user
- With `refreshToken`: Invalidates only that specific token

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for signing tokens | - |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (seconds) | 900 |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (seconds) | 604800 |
| `PORT` | Server port | 3000 |

## Commands

```bash
# Development
pnpm run start:dev         # Start with hot reload

# Testing
pnpm run test              # Run unit tests
pnpm run test:watch        # Watch mode
pnpm run test:cov          # Coverage report

# Database
npx prisma migrate dev     # Run migrations
npx prisma studio          # Open Prisma Studio

# Build
pnpm run build             # Production build
pnpm run start:prod        # Production start
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- Access tokens are stateless JWTs (cannot be revoked before expiry)
- Refresh tokens are stored in database and can be revoked
- Refresh token rotation prevents token reuse
- Password is never returned in API responses (uses `@Exclude()` decorator)
- ValidationPipe strips unknown properties from requests

## Potential Improvements

### Security Enhancements
- [ ] **Rate limiting** - Prevent brute force attacks on login/register endpoints
- [ ] **Account lockout** - Lock account after N failed login attempts
- [ ] **Access token blacklisting** - Use Redis to revoke access tokens before expiry
- [ ] **Password complexity rules** - Enforce stronger password requirements
- [ ] **Helmet.js** - Add security headers

### Feature Additions
- [ ] **Email verification** - Require email confirmation before activation
- [ ] **Password reset** - "Forgot password" flow with email tokens
- [ ] **Two-factor authentication (2FA)** - TOTP-based second factor
- [ ] **OAuth2 providers** - Login with Google, GitHub, etc.
- [ ] **User roles/permissions** - Role-based access control (RBAC)
- [ ] **Session management** - View and revoke active sessions

### Code Quality
- [ ] **E2E tests** - Integration tests with test database
- [ ] **Request logging** - Structured logging with correlation IDs
- [ ] **Health check endpoint** - `/health` for monitoring
- [ ] **API versioning** - `/v1/auth/...` prefix
- [ ] **Response interceptor** - Standardized API response format

### Infrastructure
- [ ] **Docker support** - Dockerfile and docker-compose for the project
- [ ] **CI/CD pipeline** - GitHub Actions for testing and deployment
- [ ] **Environment validation** - Fail fast on missing env vars

## Project Status

This is a **beginner-level** practice project demonstrating core authentication concepts with NestJS.
