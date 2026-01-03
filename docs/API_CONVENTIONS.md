# API Conventions Guide

**Progressive REST conventions by complexity levels**

---

## Table of Contents

1. [General Conventions](#general-conventions)
2. [Beginner Level Conventions](#beginner-level-conventions)
3. [Intermediate Level Conventions](#intermediate-level-conventions)
4. [Advanced Level Conventions](#advanced-level-conventions-rfc-7807)
5. [Expert Level Conventions](#expert-level-conventions)
6. [Error Handling](#error-handling)
7. [RFC 7807 - Problem Details](#rfc-7807---problem-details-for-http-apis)

---

## General Conventions

### HTTP Methods

| Method      | Usage                          | Idempotency                    |
| ----------- | ------------------------------ | ------------------------------ |
| **GET**     | Get resource (does not modify) | Yes                            |
| **POST**    | Create resource                | No                             |
| **PUT**     | Replace entire resource        | Yes                            |
| **PATCH**   | Partially update               | Yes (if implemented correctly) |
| **DELETE**  | Delete resource                | Yes                            |
| **HEAD**    | Like GET but without body      | Yes                            |
| **OPTIONS** | Describe communication options | Yes                            |

### Basic Status Codes

| Code    | Meaning               | Usage                               |
| ------- | --------------------- | ----------------------------------- |
| **2xx** | Success               | -                                   |
| 200     | OK                    | Successful GET, PUT, PATCH          |
| 201     | Created               | POST that creates resource          |
| 204     | No Content            | DELETE, or empty response           |
| **3xx** | Redirection           | -                                   |
| 301     | Moved Permanently     | Permanent URL change                |
| **4xx** | Client error          | -                                   |
| 400     | Bad Request           | Invalid input                       |
| 401     | Unauthorized          | Not authenticated                   |
| 403     | Forbidden             | Authenticated but no permission     |
| 404     | Not Found             | Resource does not exist             |
| 409     | Conflict              | Conflict (e.g.: duplicate resource) |
| **5xx** | Server error          | -                                   |
| 500     | Internal Server Error | General server error                |
| 503     | Service Unavailable   | Service unavailable                 |

---

## Beginner Level Conventions

**For:** User Auth API, Simple CRUD, Notes App, Blog API

### 1. URL Structure

**Plurals for collections:**

```
GET    /users              # List users
POST   /users              # Create user
GET    /users/:id          # Get user
PUT    /users/:id          # Replace user
DELETE /users/:id          # Delete user

GET    /users/:id/posts    # Posts from a user
POST   /users/:id/posts    # Create post for user
```

**Singulars for singleton:**

```
GET    /auth/profile       # Current user's profile
PUT    /auth/profile       # Update profile
```

**Verbs only when necessary:**

```
POST   /users/:id/logout   # Logout is action, not resource
POST   /password/reset     # Reset is action
```

### 2. Request/Response Format

**Always JSON:**

```typescript
// Request
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

// Response 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-02T10:00:00Z"
}
```

### 3. Basic Pagination

```typescript
// Query params
GET /posts?page=1&limit=10

// Response
{
  "data": [
    { "id": "1", "title": "Post 1" },
    { "id": "2", "title": "Post 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}

// DTOs
export class PaginationDto {
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @IsNumber()
  limit: number = 10;
}
```

### 4. Simple Filters

```typescript
// Search
GET /posts?search=typescript

// Sorting
GET /posts?sort=createdAt&order=desc

// Filters
GET /posts?status=published&category=tech

// DTOs
export class FindPostsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'title', 'author'])
  sort?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
```

### 5. Simple Error Responses

```typescript
// Error 400 - Bad Request
{
  "statusCode": 400,
  "message": "Invalid input",
  "error": "BadRequestException"
}

// Error 401 - Unauthorized
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "UnauthorizedException"
}

// Error 404 - Not Found
{
  "statusCode": 404,
  "message": "User not found",
  "error": "NotFoundException"
}
```

### 6. Example: Blog API (Beginner)

```typescript
// src/blog/dto/create-post.dto.ts
export class CreatePostDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class PostResponseDto {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/blog/blog.controller.ts
@Controller('posts')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get()
  async findAll(
    @Query() query: FindPostsDto
  ): Promise<{ data: PostResponseDto[]; pagination: any }> {
    const { posts, total } = await this.blogService.findAll(query);
    return {
      data: posts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreatePostDto): Promise<PostResponseDto> {
    return this.blogService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostResponseDto> {
    const post = await this.blogService.findOne(id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto
  ): Promise<PostResponseDto> {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.blogService.delete(id);
  }
}
```

---

## Intermediate Level Conventions

**For:** E-commerce, Task Management, Chat App, File Upload

### In addition to Beginner...

### 1. API Versioning

```typescript
// Header-based
GET / api / users;
Accept: application / vnd.myapi.v1 + json;

// URL-based (more common)
GET / api / v1 / users;
GET / api / v2 / users;

// In controller
@Controller('api/v1')
export class UserControllerV1 {}

@Controller('api/v2')
export class UserControllerV2 {}
```

### 2. Content Negotiation

```typescript
// Accept different formats
GET /reports?format=json
GET /reports?format=csv
GET /reports?format=pdf

// Headers
GET /reports
Accept: application/json
---
Accept: text/csv
---
Accept: application/pdf
```

### 3. Rate Limiting

```typescript
// Response headers
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459261

// Implementation
@UseGuards(ThrottlerGuard)
@Controller('users')
export class UserController {}

// Configuration
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10, // 10 requests per minute
})
```

### 4. Caching Headers

```typescript
// Response headers
HTTP/1.1 200 OK
Cache-Control: public, max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2026 07:28:00 GMT

// Implementation
@Controller('products')
export class ProductController {
  @Get(':id')
  @SetMetadata('cache', { ttl: 3600 })
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
```

### 5. Request/Response Envelopes

```typescript
// Always wrap successful responses
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "1",
    "name": "John"
  },
  "timestamp": "2026-01-02T10:00:00Z"
}

// With metadata
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "meta": {
    "version": "1.0",
    "timestamp": "2026-01-02T10:00:00Z"
  }
}
```

### 6. Advanced Validation

```typescript
// DTOs with complex validations
export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT_CARD)
  @IsCreditCard()
  cardNumber?: string;
}

export class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

### 7. Swagger Documentation

```typescript
@ApiTags('Users')
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ type: UserResponseDto })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
```

### 8. Advanced Filtering

```typescript
// Query object pattern
GET /products?filter[category]=electronics&filter[price][gte]=100&filter[price][lte]=500&sort=-createdAt

// Filtering object
export class FilterProductsDto {
  @Type(() => Number)
  @Min(0)
  'filter[price][gte]'?: number;

  @Type(() => Number)
  @Max(9999)
  'filter[price][lte]'?: number;

  @IsOptional()
  'filter[category]'?: string;

  @IsOptional()
  @IsIn(['createdAt', 'price', '-createdAt', '-price'])
  sort?: string;
}
```

### 9. Soft Deletes

```typescript
// By default exclude deleted
GET /users
// Returns only non-deleted users

// Include deleted
GET /users?includeSoftDeleted=true

// Only deleted
GET /users?onlySoftDeleted=true

// Implementation
export class FindUsersDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  includeSoftDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  onlySoftDeleted?: boolean;
}
```

### 10. CORS and Security Headers

```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://example.com'],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
});

app.use(helmet()); // Security headers

// Custom middleware
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  }
}
```

### 11. Example: E-commerce API (Intermediate)

```typescript
@ApiTags('Products')
@Controller('api/v1/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filtering' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'Products list',
    type: [ProductResponseDto],
  })
  async findAll(@Query() query: FindProductsDto) {
    const { products, total } = await this.productService.findAll(query);
    return {
      success: true,
      statusCode: 200,
      data: products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productService.create(dto);
    return {
      success: true,
      statusCode: 201,
      data: product,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @SetMetadata('cache', { ttl: 3600 })
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(id);
    if (!product) throw new NotFoundException('Product not found');
    return {
      success: true,
      statusCode: 200,
      data: product,
    };
  }
}
```

---

## Advanced Level Conventions - RFC 7807

**For:** Social Media, Payments, Notifications, Admin Dashboard

### In addition to Intermediate...

### RFC 7807 - Problem Details for HTTP APIs

[RFC 7807](https://tools.ietf.org/html/rfc7807) defines a standard format for reporting errors in HTTP APIs.

#### 1. RFC 7807 Standard Structure

```json
{
  "type": "https://example.com/problems/out-of-credit",
  "title": "Out of Credit",
  "status": 402,
  "detail": "Your current balance is 30, but that costs 50.",
  "instance": "/accounts/12345/msgs/abc",
  "timestamp": "2026-01-02T10:00:00Z",
  "traceId": "req-12345"
}
```

**Fields:**

- `type` (string, URI): Reference to error documentation
- `title` (string): Short title of the problem
- `status` (number): HTTP status code
- `detail` (string): Specific description of the problem
- `instance` (string, URI): Reference to the specific instance of the problem
- `timestamp` (string, ISO-8601): When the error occurred
- `traceId` (string): Trace ID for debugging

#### 2. Problem Details Implementation

```typescript
// src/common/exceptions/problem-details.exception.ts
export class ProblemDetailsException extends HttpException {
  constructor(public readonly problemDetails: ProblemDetails, status: number) {
    super(problemDetails, status);
  }
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  timestamp?: string;
  traceId?: string;
  extensions?: Record<string, any>;
}

// src/common/exceptions/problem-details.factory.ts
export class ProblemDetailsFactory {
  static emailAlreadyExists(email: string, instance: string): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/email-already-exists',
      title: 'Email Already Exists',
      status: 409,
      detail: `The email '${email}' is already registered in our system.`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        conflictField: 'email',
        value: email,
      },
    };
  }

  static insufficientBalance(
    required: number,
    available: number,
    instance: string
  ): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/insufficient-balance',
      title: 'Insufficient Balance',
      status: 402,
      detail: `Required balance: ${required}, but available: ${available}.`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        required,
        available,
        shortage: required - available,
      },
    };
  }

  static invalidInput(
    field: string,
    reason: string,
    instance: string
  ): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/invalid-input',
      title: 'Invalid Input',
      status: 400,
      detail: `Field '${field}': ${reason}`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        field,
        reason,
      },
    };
  }

  static notFound(
    resource: string,
    identifier: string,
    instance: string
  ): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: `${resource} with ID '${identifier}' not found.`,
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        resource,
        identifier,
      },
    };
  }

  static unauthorized(reason: string, instance: string): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: reason,
      instance,
      timestamp: new Date().toISOString(),
    };
  }

  static forbidden(reason: string, instance: string): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/forbidden',
      title: 'Forbidden',
      status: 403,
      detail: reason,
      instance,
      timestamp: new Date().toISOString(),
    };
  }

  static validationError(
    errors: ValidationError[],
    instance: string
  ): ProblemDetails {
    return {
      type: 'https://api.example.com/errors/validation-failed',
      title: 'Validation Failed',
      status: 422,
      detail: 'The request contains invalid data.',
      instance,
      timestamp: new Date().toISOString(),
      extensions: {
        errors: errors.map((e) => ({
          field: e.property,
          constraints: e.constraints,
        })),
      },
    };
  }
}
```

#### 3. Global Exception Filter

```typescript
// src/common/filters/problem-details.filter.ts
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly request: Request) {}

  catch(exception: any, host: ExecutionContext) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId =
      (request.headers['x-trace-id'] as string) || generateTraceId();
    const instance = `${request.method} ${request.path}`;

    let problemDetails: ProblemDetails;
    let status = 500;

    if (exception instanceof HttpException) {
      const exResponse = exception.getResponse();
      status = exception.getStatus();

      if (exResponse instanceof ProblemDetails) {
        problemDetails = exResponse as ProblemDetails;
      } else {
        problemDetails = this.mapHttpExceptionToProblem(exception, instance);
      }
    } else if (exception instanceof ProblemDetailsException) {
      problemDetails = exception.problemDetails;
      status = exception.getStatus();
    } else if (exception instanceof ValidationError) {
      const errors = Array.isArray(exception) ? exception : [exception];
      problemDetails = ProblemDetailsFactory.validationError(errors, instance);
      status = 422;
    } else {
      // Unknown error
      problemDetails = {
        type: 'https://api.example.com/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred.',
        instance,
        timestamp: new Date().toISOString(),
        traceId,
      };
    }

    // Add traceId
    problemDetails.traceId = traceId;
    problemDetails.timestamp = new Date().toISOString();

    response.status(status).json(problemDetails);
  }

  private mapHttpExceptionToProblem(
    exception: HttpException,
    instance: string
  ): ProblemDetails {
    const status = exception.getStatus();

    const statusMap: Record<number, (msg: string) => ProblemDetails> = {
      400: (msg) =>
        ProblemDetailsFactory.invalidInput('general', msg, instance),
      401: (msg) => ProblemDetailsFactory.unauthorized(msg, instance),
      403: (msg) => ProblemDetailsFactory.forbidden(msg, instance),
      404: (msg) =>
        ProblemDetailsFactory.notFound('Resource', 'unknown', instance),
      409: (msg) => ({
        type: 'https://api.example.com/errors/conflict',
        title: 'Conflict',
        status: 409,
        detail: msg,
        instance,
        timestamp: new Date().toISOString(),
      }),
    };

    const mapper = statusMap[status];
    const message = exception.message || 'An error occurred';

    return mapper
      ? mapper(message)
      : {
          type: 'https://api.example.com/errors/server-error',
          title: 'Server Error',
          status,
          detail: message,
          instance,
          timestamp: new Date().toISOString(),
        };
  }
}

// Register in app.module.ts
app.useGlobalFilters(new ProblemDetailsFilter());
```

#### 4. Usage in Controllers

```typescript
@Controller('api/v1/orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    try {
      const order = await this.orderService.create(dto);
      return { success: true, data: order };
    } catch (error) {
      if (error instanceof InsufficientBalanceException) {
        throw new HttpException(
          ProblemDetailsFactory.insufficientBalance(
            error.required,
            error.available,
            `${req.method} ${req.path}`
          ),
          402 // Payment Required
        );
      }

      if (error instanceof EmailAlreadyExistsException) {
        throw new HttpException(
          ProblemDetailsFactory.emailAlreadyExists(
            error.email,
            `${req.method} ${req.path}`
          ),
          409
        );
      }

      throw error;
    }
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @Req() req: Request) {
    const order = await this.orderService.findById(id);

    if (!order) {
      throw new HttpException(
        ProblemDetailsFactory.notFound(
          'Order',
          id,
          `${req.method} ${req.path}`
        ),
        404
      );
    }

    return { success: true, data: order };
  }
}
```

#### 5. RFC 7807 Error Responses

**Error 409 - Duplicate Email:**

```json
{
  "type": "https://api.example.com/errors/email-already-exists",
  "title": "Email Already Exists",
  "status": 409,
  "detail": "The email 'user@example.com' is already registered in our system.",
  "instance": "POST /api/v1/users",
  "timestamp": "2026-01-02T10:30:00Z",
  "traceId": "req-abc123def456",
  "extensions": {
    "conflictField": "email",
    "value": "user@example.com"
  }
}
```

**Error 422 - Validation:**

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request contains invalid data.",
  "instance": "POST /api/v1/orders",
  "timestamp": "2026-01-02T10:31:00Z",
  "traceId": "req-xyz789abc",
  "extensions": {
    "errors": [
      {
        "field": "email",
        "constraints": {
          "isEmail": "email must be an email",
          "isNotEmpty": "email should not be empty"
        }
      },
      {
        "field": "password",
        "constraints": {
          "minLength": "password must be longer than or equal to 8 characters"
        }
      }
    ]
  }
}
```

**Error 401 - Not Authenticated:**

```json
{
  "type": "https://api.example.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Token has expired. Please refresh your authentication.",
  "instance": "GET /api/v1/profile",
  "timestamp": "2026-01-02T10:32:00Z",
  "traceId": "req-def123xyz"
}
```

### 2. Advanced Security Headers

```typescript
// src/common/middleware/security-headers.middleware.ts
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy
    res.header('Content-Security-Policy', "default-src 'self'");

    // Prevent MIME type sniffing
    res.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Frame-Options', 'SAMEORIGIN');

    // Enable XSS filtering
    res.header('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HSTS (HTTPS only)
    res.header(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );

    // Disable caching for sensitive data
    res.header('Cache-Control', 'private, max-age=0, must-revalidate');

    next();
  }
}
```

### 3. Advanced Rate Limiting

```typescript
// src/common/guards/rate-limit.guard.ts
@Injectable()
export class AdvancedRateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);

    const limit = this.getLimitByEndpoint(request.path);
    const ttl = this.getTtlByEndpoint(request.path);

    const key = `ratelimit:${identifier}:${request.path}`;
    const count = await this.redisService.increment(key);

    if (count === 1) {
      await this.redisService.expire(key, ttl);
    }

    if (count > limit) {
      throw new TooManyRequestsException(
        `Rate limit exceeded. Max ${limit} requests per ${ttl} seconds.`
      );
    }

    return true;
  }

  private getIdentifier(request: Request): string {
    return request.user?.id || request.ip;
  }

  private getLimitByEndpoint(path: string): number {
    if (path.includes('/auth/login')) return 5; // 5 login attempts
    if (path.includes('/auth/register')) return 10; // 10 registrations
    return 100; // Default
  }

  private getTtlByEndpoint(path: string): number {
    if (path.includes('/auth/login')) return 900; // 15 minutes
    if (path.includes('/auth/register')) return 3600; // 1 hour
    return 3600; // Default 1 hour
  }
}
```

### 4. Request ID Tracking

```typescript
// src/common/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || generateId();

    // Save in context
    req['requestId'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}

// Inject in request scope
@Injectable()
export class RequestIdService {
  constructor(@Inject(REQUEST) private request: Request) {}

  getId(): string {
    return this.request['requestId'];
  }
}
```

---

## Expert Level Conventions

**For:** Microservices, Streaming, SaaS, Recommendations

### In addition to Advanced...

### 1. Async Operations and Webhooks

```typescript
// Long-running operations return 202 Accepted
POST /api/v1/reports/generate
HTTP/1.1 202 Accepted

{
  "taskId": "task-12345",
  "status": "processing",
  "statusUrl": "https://api.example.com/api/v1/tasks/task-12345",
  "resultUrl": "https://api.example.com/api/v1/reports/report-12345",
  "estimatedCompletion": "2026-01-02T11:00:00Z"
}

// Client can poll
GET /api/v1/tasks/task-12345

{
  "taskId": "task-12345",
  "status": "completed",
  "progress": 100,
  "result": {
    "reportId": "report-12345",
    "url": "https://api.example.com/reports/report-12345"
  }
}
```

### 2. Webhooks and Event Notifications

```typescript
// Register webhook
POST /api/v1/webhooks
{
  "url": "https://example.com/webhooks/payment",
  "events": ["payment.completed", "payment.failed"],
  "secret": "webhook-secret-key"
}

// Webhook payload
POST https://example.com/webhooks/payment
X-Webhook-Signature: sha256=...
X-Webhook-ID: webhook-evt-12345
X-Webhook-Timestamp: 2026-01-02T10:00:00Z

{
  "id": "evt-12345",
  "type": "payment.completed",
  "timestamp": "2026-01-02T10:00:00Z",
  "data": {
    "paymentId": "pay-12345",
    "amount": 99.99,
    "status": "completed"
  }
}
```

### 3. API Versioning with Backward Compatibility

```typescript
// Deprecation headers
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Feb 2026 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"

// Message in response
{
  "data": [...],
  "_deprecated": {
    "message": "This endpoint is deprecated",
    "since": "2026-01-02",
    "until": "2026-02-01",
    "migration": "Use /api/v2/users instead"
  }
}
```

### 4. GraphQL-REST Hybrid (Optional)

```typescript
// Select specific fields
GET /api/v1/users/123?fields=id,email,name

// Embed related resources
GET /api/v1/users/123?include=posts,comments

// Resolve in application
export class FieldSelectionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const fields = request.query.fields?.split(',');

    return next.handle().pipe(
      map(data => this.selectFields(data, fields)),
    );
  }

  private selectFields(data: any, fields?: string[]): any {
    if (!fields) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.selectFields(item, fields));
    }

    const selected: any = {};
    fields.forEach(field => {
      if (field in data) {
        selected[field] = data[field];
      }
    });
    return selected;
  }
}
```

### 5. Observability and Distributed Tracing

```typescript
// OpenTelemetry Integration
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private tracer: Tracer) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const span = this.tracer.startSpan('http-request', {
      attributes: {
        'http.method': request.method,
        'http.url': request.url,
        'http.target': request.path,
      },
    });

    return next.handle().pipe(
      tap(() => {
        span.addEvent('request-completed', {
          'http.status_code': context.switchToHttp().getResponse().statusCode,
        });
        span.end();
      }),
      catchError((error) => {
        span.addEvent('request-error', { 'error.message': error.message });
        span.end();
        throw error;
      })
    );
  }
}
```

---

## Error Handling

### Exception Hierarchy

```typescript
// src/common/exceptions/index.ts

// Base
export class ApplicationException extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain Exceptions (Beginner+)
export class EmailAlreadyExistsException extends ApplicationException {
  constructor(email: string) {
    super('EMAIL_ALREADY_EXISTS', `Email ${email} already registered`);
  }
}

// Application Exceptions (Intermediate+)
export class InsufficientBalanceException extends ApplicationException {
  constructor(required: number, available: number) {
    super(
      'INSUFFICIENT_BALANCE',
      `Required: ${required}, Available: ${available}`
    );
    this.required = required;
    this.available = available;
  }
}

// Infrastructure Exceptions (Advanced+)
export class DatabaseConnectionException extends ApplicationException {
  constructor() {
    super('DATABASE_CONNECTION_ERROR', 'Failed to connect to database');
  }
}
```

### Exception Handling by Level

**Beginner:**

```typescript
try {
  await this.userService.register(email, password);
} catch (error) {
  if (error instanceof EmailAlreadyExistsException) {
    throw new BadRequestException('Email already registered');
  }
  throw error;
}
```

**Intermediate:**

```typescript
@UseFilters(HttpExceptionFilter)
@Controller('users')
export class UserController {
  // Automatic via filter
}

@Catch(ApplicationException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationException, host: ExecutionContext) {
    const response = host.switchToHttp().getResponse();

    const statusMap: Record<string, number> = {
      EMAIL_ALREADY_EXISTS: 409,
      USER_NOT_FOUND: 404,
      INVALID_PASSWORD: 401,
    };

    response.status(statusMap[exception.code] || 500).json({
      statusCode: statusMap[exception.code] || 500,
      message: exception.message,
      error: exception.code,
    });
  }
}
```

**Advanced:**

```typescript
@Catch(ApplicationException)
export class ProblemDetailsExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationException, host: ExecutionContext) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    const problemDetails = this.mapToProblemDetails(exception, request);
    response.status(this.getStatus(exception.code)).json(problemDetails);
  }

  private mapToProblemDetails(
    exception: ApplicationException,
    request: Request
  ): ProblemDetails {
    const mappers: Record<string, () => ProblemDetails> = {
      EMAIL_ALREADY_EXISTS: () =>
        ProblemDetailsFactory.emailAlreadyExists(
          'email',
          `${request.method} ${request.path}`
        ),
      INSUFFICIENT_BALANCE: () =>
        ProblemDetailsFactory.insufficientBalance(
          0,
          0,
          `${request.method} ${request.path}`
        ),
      // ...
    };

    return (mappers[exception.code] || mappers['GENERIC'])();
  }
}
```

---

## Comparative Summary

| Aspect              | Beginner    | Intermediate  | Advanced          | Expert              |
| ------------------- | ----------- | ------------- | ----------------- | ------------------- |
| **URL Structure**   | Basic REST  | + versioning  | + fields          | + GraphQL           |
| **Response Format** | Simple JSON | JSON envelope | RFC 7807          | + Webhooks          |
| **Error Handling**  | Try-catch   | Filters       | Problem Details   | Distributed tracing |
| **Validation**      | DTOs        | Advanced      | Strict validation | Custom rules        |
| **Documentation**   | README      | Swagger       | Complete OpenAPI  | AsyncAPI            |
| **Caching**         | None        | Basic         | Headers           | Redis + CDN         |
| **Rate Limiting**   | None        | Basic         | Per endpoint      | Dynamic             |
| **Security**        | CORS        | + Headers     | + Request ID      | + Tracing           |
| **Async Ops**       | Synchronous | -             | Webhooks          | Event-driven        |

---

**Last updated:** 2026-01-02
**RFC 7807:** Required from Advanced Level
**Compatibility:** Backward compatible from Intermediate
