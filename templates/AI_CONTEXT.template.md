# AI_CONTEXT.md - Context for Claude Code

**Copy this template to each project root and customize the placeholders.**

---

## Project Information

**Name:** {{PROJECT_NAME}}
**Level:** {{LEVEL}} <!-- Beginner | Intermediate | Advanced | Expert -->
**Description:** {{BRIEF_DESCRIPTION}}
**ORM:** {{ORM}} <!-- Prisma | TypeORM | Drizzle -->
**Stack:** NestJS + TypeScript + PostgreSQL + {{ORM}} {{ADDITIONAL_TECH}}

---

## Project Structure

<!-- Choose ONE structure based on project level. All use NestJS modular architecture. -->

### Beginner Level (Modular 3-Layer)

```
src/
├── {{module}}/                    # Feature module (e.g., auth/, users/)
│   ├── {{module}}.module.ts
│   ├── {{module}}.controller.ts
│   ├── {{module}}.service.ts
│   ├── {{module}}.repository.ts   # If needed
│   ├── entities/
│   │   └── {{entity}}.entity.ts
│   └── dto/
│       ├── create-{{entity}}.dto.ts
│       └── {{entity}}-response.dto.ts
├── common/                        # Shared utilities
│   ├── decorators/
│   ├── filters/
│   └── pipes/
├── config/                        # App configuration
│   └── database.config.ts
├── app.module.ts
└── main.ts

test/
├── {{module}}.service.spec.ts
└── {{module}}.e2e-spec.ts
```

### Intermediate Level (Modular + Clean Architecture)

```
src/
├── {{module}}/                    # Feature module with Clean Arch
│   ├── {{module}}.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── {{entity}}.entity.ts
│   │   └── repositories/
│   │       └── {{entity}}.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-{{entity}}.dto.ts
│   │   │   └── {{entity}}-response.dto.ts
│   │   ├── services/
│   │   │   └── {{entity}}.service.ts
│   │   └── use-cases/
│   │       └── {{use-case}}.use-case.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── {{module}}.controller.ts
│       └── persistence/
│           └── {{entity}}.repository.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   └── pipes/
├── config/
│   └── database.config.ts
├── app.module.ts
└── main.ts
```

### Advanced/Expert Level (Modular + Full DDD)

```
src/
├── {{module}}/                    # Feature module with DDD
│   ├── {{module}}.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── {{entity}}.aggregate.ts
│   │   ├── entities/
│   │   │   └── {{entity}}.entity.ts
│   │   ├── value-objects/
│   │   │   └── {{value-object}}.vo.ts
│   │   ├── events/
│   │   │   └── {{entity}}-created.event.ts
│   │   └── repositories/
│   │       └── {{entity}}.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   └── create-{{entity}}.command.ts
│   │   ├── queries/
│   │   │   └── get-{{entity}}.query.ts
│   │   ├── dto/
│   │   │   └── {{entity}}-response.dto.ts
│   │   └── mappers/
│   │       └── {{entity}}.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── {{module}}.controller.ts
│       ├── persistence/
│       │   └── {{entity}}.repository.ts
│       └── event-handlers/
│           └── {{entity}}-created.handler.ts
├── common/
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   └── exceptions/
├── config/
│   └── database.config.ts
├── app.module.ts
└── main.ts

test/
├── {{module}}.service.spec.ts
├── {{module}}.e2e-spec.ts
└── jest-e2e.json
```

---

## Architecture

<!-- Select appropriate level -->

### Beginner (3 layers)
```
Controller → Service → Repository → Database
```

### Intermediate (4 layers)
```
Controller → UseCase/Service → Domain → Repository
```

### Advanced (5+ layers with DDD)
```
Controller → Command/Query Handler → Domain (Aggregates) → Repository
```

**Patterns Used:**
- {{PATTERN_1}}
- {{PATTERN_2}}
- {{PATTERN_3}}

**Flow:**
```
HTTP Request
    ↓
Controller (validates request)
    ↓
UseCase / Service (business logic)
    ↓
Repository (data access)
    ↓
Database
```

---

## Entities

### {{EntityName}} Entity

```typescript
export class {{EntityName}} {
  id: string;
  // Add entity properties
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // If soft delete needed
}
```

### DTOs

**Create{{EntityName}}Dto** (input)
- {{field}}: {{type}} ({{validations}})

**{{EntityName}}ResponseDto** (output)
- {{field}}: {{type}}

---

## Security Requirements

### Authentication
<!-- Remove if not applicable -->
- [ ] JWT tokens
- [ ] Password hashing (bcrypt)
- [ ] Rate limiting

### Authorization
<!-- Remove if not applicable -->
- [ ] Role-based access (RBAC)
- [ ] Resource ownership validation

### Validation
- [ ] DTOs with class-validator
- [ ] Input sanitization

### Error Handling
<!-- For Advanced+, use RFC 7807 -->
- [ ] Consistent error responses
- [ ] No stack traces in production
- [ ] Security event logging

---

## Endpoints

### {{HTTP_METHOD}} /{{resource}}

**Description:** {{description}}

**Request:**
```json
{
  "field": "value"
}
```

**Success ({{STATUS_CODE}}):**
```json
{
  "field": "value"
}
```

**Error ({{ERROR_CODE}}):**
```json
{
  "statusCode": {{ERROR_CODE}},
  "message": "Error message",
  "error": "ExceptionType"
}
```

<!-- For Advanced+ projects, use RFC 7807 format:
{
  "type": "https://api.example.com/errors/{{error-type}}",
  "title": "Error Title",
  "status": {{ERROR_CODE}},
  "detail": "Detailed error message",
  "instance": "{{HTTP_METHOD}} /{{resource}}"
}
-->

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('{{ServiceName}}', () => {
  describe('{{methodName}}', () => {
    it('should {{expected_behavior}}');
    it('should throw error when {{error_condition}}');
  });
});
```

### E2E Tests

```typescript
describe('{{Resource}} Endpoints', () => {
  describe('{{HTTP_METHOD}} /{{resource}}', () => {
    it('should {{expected_behavior}}');
    it('should fail when {{error_condition}}');
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

### ORM-Specific

<!-- Prisma -->
```json
{
  "@prisma/client": "^5.0.0"
}
// Dev: "prisma": "^5.0.0"
```

<!-- TypeORM -->
```json
{
  "typeorm": "^0.3.0",
  "@nestjs/typeorm": "^10.0.0",
  "pg": "^8.11.0"
}
```

<!-- Drizzle -->
```json
{
  "drizzle-orm": "^0.29.0",
  "drizzle-kit": "^0.20.0",
  "postgres": "^3.4.0"
}
```

### Project-Specific
```json
{
  // Add project-specific dependencies
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
DATABASE_NAME={{database_name}}

# Add project-specific config
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

### Style
- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Workflow with Claude Code

### 1. Setup
```
"Create the folder and file structure for {{PROJECT_NAME}} with {{ARCHITECTURE_LEVEL}} architecture"
```

### 2. Domain Layer
```
"Implement {{EntityName}} entity and I{{EntityName}}Repository interface"
```

### 3. Application Layer
```
"Implement DTOs, {{ServiceName}}, and use cases for {{feature}}"
```

### 4. Infrastructure Layer
```
"Implement {{ControllerName}} with endpoints and {{EntityName}}Repository"
```

### 5. Testing
```
"Create unit tests for {{ServiceName}} and e2e tests for {{ControllerName}}"
```

---

## Learning Goals

Upon completing this project:
- [ ] {{LEARNING_GOAL_1}}
- [ ] {{LEARNING_GOAL_2}}
- [ ] {{LEARNING_GOAL_3}}

---

## Next Steps

After completion:
1. {{ENHANCEMENT_1}}
2. {{ENHANCEMENT_2}}

Then proceed to: **{{NEXT_PROJECT}}**

---

## Quick Reference

**Where does X go? (All levels use modular structure)**

*Beginner (Modular 3-Layer):*
- Business logic → `src/{{module}}/{{module}}.service.ts`
- DTOs → `src/{{module}}/dto/`
- Database access → `src/{{module}}/{{module}}.repository.ts`
- Endpoints → `src/{{module}}/{{module}}.controller.ts`
- Entities → `src/{{module}}/entities/`

*Intermediate+ (Modular + Clean Architecture):*
- Business logic → `src/{{module}}/application/services/` or `src/{{module}}/application/use-cases/`
- DTOs → `src/{{module}}/application/dto/`
- Database access → `src/{{module}}/infrastructure/persistence/`
- Endpoints → `src/{{module}}/infrastructure/controllers/`
- Domain entities → `src/{{module}}/domain/entities/`

**ORM Commands:**

<!-- Prisma -->
```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev --name {{migration_name}}
pnpm exec prisma studio
```

<!-- TypeORM -->
```bash
pnpm run typeorm migration:generate -- --name {{MigrationName}}
pnpm run typeorm migration:run
```

<!-- Drizzle -->
```bash
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
pnpm exec drizzle-kit studio
```

---

**Last updated:** {{DATE}}
**To use:** Copy to project root, customize placeholders, then run `claude code`
