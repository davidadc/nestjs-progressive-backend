# AI_CONTEXT.md - Context for Claude Code

**This file should be copied to the root of each NestJS project to guide Claude.**

---

## 📋 Project Information

**Name:** User Authentication API
**Level:** Beginner
**Description:** Basic authentication system with registration and login
**Stack:** NestJS + TypeScript + PostgreSQL + Prisma + JWT

---

## 🏗️ Project Structure

<!-- Beginner Level: Simple 3-Layer Architecture -->

```
src/
├── controllers/
│   └── auth.controller.ts
├── services/
│   └── auth.service.ts
├── repositories/
│   └── user.repository.ts
├── entities/
│   └── user.entity.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── login.dto.ts
│   └── user-response.dto.ts
├── guards/
│   └── jwt.guard.ts
├── decorators/
│   └── user.decorator.ts
├── exceptions/
│   └── auth.exceptions.ts
├── config/
│   ├── jwt.config.ts
│   └── database.config.ts
├── app.module.ts
└── main.ts

test/
├── auth.service.spec.ts
├── auth.controller.spec.ts
└── jest-e2e.json
```

---

## 🎯 Patterns and Principles

### Architecture (Beginner - 3 Layers)

- **Layered Architecture:** Controllers → Services → Repositories
- **Repository Pattern:** Persistence abstraction
- **Dependency Injection:** NestJS IoC container
- **SOLID Principles:** Single Responsibility, Open/Closed, etc.

### Flow Pattern

```
HTTP Request
    ↓
Controller (validates request, authorization)
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
Database
```

---

## 📝 Entities and DTOs

### User Entity (Domain)

```typescript
export class User {
  id: string; // UUID
  email: string; // Unique
  password: string; // Hashed
  name: string;
  role: 'user' | 'admin'; // Default 'user'
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete

  // Domain methods
  isPasswordValid(password: string): Promise<boolean>;
  getPublicData(): Omit<User, 'password'>;
}
```

### DTOs

**CreateUserDto** (input)

- email: string (required, valid email, unique)
- password: string (required, min 8 chars)
- passwordConfirm: string (required, must match password)
- name: string (optional)

**LoginDto** (input)

- email: string (required, valid email)
- password: string (required)

**UserResponseDto** (output)

- id: string
- email: string
- name: string
- role: string
- createdAt: Date

---

## 🔐 Security Requirements

### Authentication

- ✅ JWT tokens (Access token: 15 min, Refresh token: 7 days)
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ Email validation
- ✅ Rate limiting: max 5 login attempts per IP in 15 min
- ✅ Tokens invalidated on logout

### Validation

- ✅ DTOs with class-validator
- ✅ Unique email in DB
- ✅ Password requirements (min 8 chars, with number or symbol)
- ✅ Input sanitization

### Error Handling

- ✅ Do not reveal if email exists (on login)
- ✅ Do not expose stack traces in production
- ✅ Security logs for failed attempts

---

## 🔌 Endpoints

### POST /auth/register

**Description:** Register new user

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "passwordConfirm": "SecurePass123!",
  "name": "John Doe"
}
```

**Success (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2026-01-02T10:00:00Z"
}
```

**Error (400 - email already exists):**

```json
{
  "statusCode": 400,
  "message": "Email already registered",
  "error": "BadRequestException"
}
```

### POST /auth/login

**Description:** Log in

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success (200):**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "550e8400...",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Error (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "UnauthorizedException"
}
```

### GET /auth/profile

**Description:** Get authenticated user profile

**Headers:** Authorization: Bearer {accessToken}

**Success (200):**

```json
{
  "id": "550e8400...",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2026-01-02T10:00:00Z"
}
```

### POST /auth/logout

**Description:** Log out

**Headers:** Authorization: Bearer {accessToken}

**Success (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## 🧪 Testing Strategy

### Unit Tests (80% minimum coverage)

**Auth Service:**

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with valid data');
    it('should throw error if email already exists');
    it('should hash password before saving');
    it('should throw error if password < 8 chars');
  });

  describe('login', () => {
    it('should return tokens if credentials are valid');
    it('should throw error if user not found');
    it('should throw error if password is invalid');
  });

  describe('validateUser', () => {
    it('should return user if token is valid');
    it('should throw error if token is expired');
  });
});
```

**Password Validation:**

```typescript
describe('PasswordValidation', () => {
  it('should accept password >= 8 chars with number');
  it('should reject password < 8 chars');
  it('should reject password without number or symbol');
});
```

### E2E Tests

```typescript
describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register and return user');
    it('should fail with duplicate email');
  });

  describe('POST /auth/login', () => {
    it('should login and return tokens');
    it('should fail with invalid credentials');
  });

  describe('GET /auth/profile', () => {
    it('should return profile if authenticated');
    it('should fail if token is invalid');
  });
});
```

---

## 📦 Main Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/jwt": "^12.0.0",
  "@nestjs/passport": "^10.0.0",
  "@prisma/client": "^5.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0",
  "uuid": "^9.0.0"
}
```

**Dev Dependencies:**
```json
{
  "prisma": "^5.0.0"
}
```

> **Note:** This project uses Prisma. Other projects may use TypeORM or Drizzle.
> See GUIDE.md for ORM assignments per project.

---

## ⚙️ Configuration

### JWT Config (.env)

```bash
JWT_SECRET=your-very-secure-secret-key-here
JWT_EXPIRATION=900                    # 15 minutes
JWT_REFRESH_EXPIRATION=604800         # 7 days
```

### Database Config (.env)

```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=dev
DATABASE_PASSWORD=dev
DATABASE_NAME=practice_db
```

---

## 📚 Code Conventions

### Naming Conventions

- **Controllers:** `*.controller.ts`
- **Services:** `*.service.ts`
- **Repositories:** `*.repository.ts`
- **DTOs:** `*.dto.ts`
- **Entities:** `*.entity.ts`
- **Exceptions:** `*.exception.ts`
- **Guards:** `*.guard.ts`

### Code Style

- Strict TypeScript enabled
- Prettier for formatting
- ESLint for linting
- 2 spaces indentation

### Comments

```typescript
/**
 * Registers a new user in the system.
 * @param createUserDto - User data to register
 * @throws EmailAlreadyExistsException if email already exists
 * @returns Promise<User> - Created user without password
 */
async register(createUserDto: CreateUserDto): Promise<User> {
  // Implementation...
}
```

---

## 🔄 Typical Workflow with Claude Code

### 1. Create base structure

```
"Create the folder and file structure for this NestJS project with 3-layer architecture"
```

### 2. Implement entities and DTOs

```
"Implement:
- User entity in src/entities/
- CreateUserDto, LoginDto, UserResponseDto in src/dto/"
```

### 3. Implement services and repositories

```
"Implement:
- UserRepository in src/repositories/
- AuthService with register(), login(), validateUser() methods in src/services/"
```

### 4. Implement controllers and guards

```
"Implement:
- AuthController with /register, /login, /profile endpoints
- JwtGuard for protected routes
- JwtConfig and DatabaseConfig"
```

### 5. Add testing

```
"Create unit tests for AuthService and e2e for AuthController
Minimum 80% coverage"
```

### 6. Documentation

```
"Generate Swagger documentation for authentication endpoints"
```

---

## 🎓 Learning Points

Upon completing this project you will learn:

- ✅ Layered Architecture in NestJS
- ✅ Authentication with JWT
- ✅ Password hashing with bcrypt
- ✅ Repository Pattern for data access
- ✅ DTOs and validation
- ✅ Error handling
- ✅ Unit and e2e testing
- ✅ Documentation with Swagger

---

## 🚀 Next Steps

Once completed:

1. Add refresh token rotation
2. Add 2FA (Two-Factor Authentication)
3. Add email verification
4. Add social login (OAuth)

Then move on to the next project: **Simple CRUD API**

---

## 📞 Quick Help

**Where does X go?**

- Business logic → `services/`
- HTTP validation → `dto/`
- Database access → `repositories/`
- Endpoints → `controllers/`
- Domain models → `entities/`

**How do I do X?**

- Validate input → class-validator in DTO
- Protect endpoint → @UseGuards(JwtGuard)
- Access user → @CurrentUser() decorator
- Test endpoint → supertest in test/

---

**Last updated:** 2026-01-02
**To use:** `claude code --context AI_CONTEXT.md`
