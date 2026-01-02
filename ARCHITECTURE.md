# Architecture Guide

**Progressive architecture by complexity levels**

---

## Table of Contents

1. [Fundamental Principles](#fundamental-principles)
2. [Beginner Level Architecture](#beginner-level-architecture)
3. [Intermediate Level Architecture](#intermediate-level-architecture)
4. [Advanced Level Architecture](#advanced-level-architecture)
5. [Expert Level Architecture](#expert-level-architecture)
6. [SOLID Principles](#solid-principles)
7. [DRY - Don't Repeat Yourself](#dry---dont-repeat-yourself)
8. [Dependency Injection](#dependency-injection)
9. [Testing Strategy](#testing-strategy)

---

## Fundamental Principles

### SOLID Principles (All levels)

#### 1. Single Responsibility Principle (SRP)

**A class should have only one reason to change**

❌ **Bad:**

```typescript
class UserService {
  // Multiple responsibilities
  async createUser(email: string, password: string) {}
  async sendWelcomeEmail(email: string) {}
  async validateEmail(email: string) {}
  async generateReport() {}
  async deleteOldUsers() {}
}
```

✅ **Good:**

```typescript
class CreateUserUseCase {
  // One responsibility: create user
  async execute(command: CreateUserCommand): Promise<User> {}
}

class UserEmailService {
  // One responsibility: send emails
  async sendWelcomeEmail(user: User): Promise<void> {}
}

class EmailValidator {
  // One responsibility: validate emails
  validate(email: string): boolean {}
}
```

#### 2. Open/Closed Principle (OCP)

**Open for extension, closed for modification**

❌ **Bad:**

```typescript
class ReportGenerator {
  generate(type: string) {
    if (type === 'pdf') {
      // generate PDF
    } else if (type === 'excel') {
      // generate Excel
    }
    // Each new type requires modifying the class
  }
}
```

✅ **Good:**

```typescript
interface IReportFormatter {
  format(data: any): Promise<Buffer>;
}

class PdfFormatter implements IReportFormatter {
  async format(data: any): Promise<Buffer> {}
}

class ExcelFormatter implements IReportFormatter {
  async format(data: any): Promise<Buffer> {}
}

class ReportGenerator {
  constructor(private formatter: IReportFormatter) {}

  async generate(data: any): Promise<Buffer> {
    return this.formatter.format(data);
  }
}
```

#### 3. Liskov Substitution Principle (LSP)

**Objects of a derived class can substitute the base class**

❌ **Bad:**

```typescript
class Bird {
  fly() {
    return 'flying';
  }
}

class Penguin extends Bird {
  fly() {
    throw new Error("Penguins can't fly");
  }
}

// LSP violated: I cannot use Penguin where I expect Bird
```

✅ **Good:**

```typescript
interface IAnimal {
  move(): string;
}

class Bird implements IAnimal {
  move() {
    return 'flying';
  }
}

class Penguin implements IAnimal {
  move() {
    return 'swimming';
  }
}
```

#### 4. Interface Segregation Principle (ISP)

**Many specific interfaces are better than one general interface**

❌ **Bad:**

```typescript
interface IRepository {
  create(data: any): Promise<any>;
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  customSearch(query: string): Promise<any[]>;
  generateReport(): Promise<Report>;
  // ... many more methods
}
```

✅ **Good:**

```typescript
interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface ISearchable<T> {
  search(query: string): Promise<T[]>;
}

interface IReportable {
  generateReport(): Promise<Report>;
}

// Use composition as needed
class UserRepository implements IRepository<User>, ISearchable<User> {}
```

#### 5. Dependency Inversion Principle (DIP)

**Depend on abstractions, not on implementations**

❌ **Bad:**

```typescript
class UserService {
  private userRepository: UserRepository; // Depends on implementation

  constructor() {
    this.userRepository = new UserRepository(); // Coupled
  }
}
```

✅ **Good:**

```typescript
class UserService {
  constructor(private userRepository: IUserRepository) {} // Depends on abstraction
}

// In the module
@Module({
  providers: [
    {
      provide: IUserRepository,
      useClass: PostgresUserRepository, // Easy to change
    },
  ],
})
export class UserModule {}
```

---

### DRY - Don't Repeat Yourself

**Don't repeat code. Extract into reusable functions, classes, utilities.**

❌ **Repetition:**

```typescript
class UserController {
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    if (!dto.email.includes('@'))
      throw new BadRequestException('Invalid email');
    if (dto.password.length < 8)
      throw new BadRequestException('Password too short');
    // Logic...
  }

  @Post('recover')
  async recover(@Body() dto: RecoverDto) {
    if (!dto.email.includes('@'))
      throw new BadRequestException('Invalid email'); // REPEATED
    // Logic...
  }
}
```

✅ **DRY:**

```typescript
class EmailValidator {
  validate(email: string): boolean {
    return email.includes('@');
  }
}

class PasswordValidator {
  validate(password: string): boolean {
    return password.length >= 8;
  }
}

class UserController {
  constructor(
    private emailValidator: EmailValidator,
    private passwordValidator: PasswordValidator
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    if (!this.emailValidator.validate(dto.email)) {
      throw new BadRequestException('Invalid email');
    }
  }
}
```

**Also extract common validations:**

```typescript
// common/decorators/validate-email.decorator.ts
export function ValidateEmail() {
  return ValidateIf((o) => o.email !== undefined);
  && IsEmail();
}

// Use in DTOs
class RegisterDto {
  @ValidateEmail()
  email: string;
}
```

---

## Beginner Level Architecture

**For:** User Auth API, Simple CRUD, Notes App, Blog API
**Complexity:** Low | **Scalability:** Local

### 1. Pattern: Layered Architecture (Simple)

```
Controller Layer (HTTP)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database
```

### 2. Folder Structure

```
src/
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── entities/
│   └── user.entity.ts
├── services/
│   └── user.service.ts
├── repositories/
│   └── user.repository.ts
├── controllers/
│   └── user.controller.ts
├── guards/
│   └── jwt.guard.ts
└── app.module.ts
```

### 3. Example: User Service (Beginner)

```typescript
// src/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

// src/repositories/user.repository.ts
@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(email: string, password: string, name: string): Promise<User> {
    const user = this.repo.create({ email, password, name });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

// src/services/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService
  ) {}

  async register(email: string, password: string, name: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await this.passwordService.hash(password);
    return this.userRepository.create(email, hashedPassword, name);
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.passwordService.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}

// src/controllers/user.controller.ts
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.userService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.userService.login(dto.email, dto.password);
  }
}
```

### 4. Applied Principles

- ✅ **SRP:** Each class has one responsibility
- ✅ **DRY:** Reuse service methods
- ✅ **DIP:** Inject UserRepository in UserService
- ⚠️ **Simplified:** No separate domain entities
- ⚠️ **Direct:** Services + Repositories without Use Cases

---

## Intermediate Level Architecture

**For:** E-commerce, Task Management, Chat App, File Upload
**Complexity:** Medium | **Scalability:** Locally scalable

### 1. Pattern: Basic Clean Architecture

```
Presentation Layer (Controllers)
    ↓
Application Layer (Use Cases, Services, DTOs)
    ↓
Domain Layer (Entities, Interfaces)
    ↓
Infrastructure Layer (Repositories, External Services)
    ↓
Database
```

### 2. Folder Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── product.entity.ts
│   ├── repositories/
│   │   ├── user.repository.interface.ts
│   │   └── product.repository.interface.ts
│   └── exceptions/
│       └── domain.exceptions.ts
│
├── application/
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── user-response.dto.ts
│   ├── services/
│   │   └── user.service.ts
│   ├── use-cases/
│   │   ├── register.use-case.ts
│   │   └── login.use-case.ts
│   └── mappers/
│       └── user.mapper.ts
│
├── infrastructure/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── persistence/
│   │   ├── typeorm/
│   │   │   ├── user.entity.ts
│   │   │   └── user.repository.ts
│   │   └── mappers/
│   │       └── user.persistence.mapper.ts
│   ├── guards/
│   │   └── jwt.guard.ts
│   ├── config/
│   │   ├── jwt.config.ts
│   │   └── database.config.ts
│   └── services/
│       └── password.service.ts
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── pipes/
│   └── exceptions/
│
└── app.module.ts
```

### 3. Example: Product Use Case (Intermediate)

```typescript
// src/domain/entities/product.entity.ts
export class Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;

  static create(data: CreateProductData): Product {
    const product = new Product();
    product.id = generateId();
    product.name = data.name;
    product.price = data.price;
    product.stock = data.stock;
    product.categoryId = data.categoryId;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    return product;
  }

  updateStock(quantity: number): void {
    if (this.stock + quantity < 0) {
      throw new InsufficientStockException();
    }
    this.stock += quantity;
  }
}

// src/domain/repositories/product.repository.interface.ts
export interface IProductRepository {
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(skip: number, take: number): Promise<Product[]>;
  update(id: string, product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

// src/application/dto/create-product.dto.ts
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsUUID()
  categoryId: string;
}

export class ProductResponseDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
}

// src/application/use-cases/create-product.use-case.ts
@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    @Inject('CATEGORY_REPOSITORY')
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    // Validate that the category exists
    const category = await this.categoryRepository.findById(command.categoryId);
    if (!category) {
      throw new CategoryNotFoundedException();
    }

    // Create domain entity
    const product = Product.create({
      name: command.name,
      price: command.price,
      stock: command.stock,
      categoryId: command.categoryId,
    });

    // Persist
    return this.productRepository.save(product);
  }
}

// src/application/mappers/product.mapper.ts
export class ProductMapper {
  static toDomain(raw: any): Product {
    const product = new Product();
    product.id = raw.id;
    product.name = raw.name;
    product.price = raw.price;
    product.stock = raw.stock;
    product.categoryId = raw.categoryId;
    product.createdAt = raw.createdAt;
    product.updatedAt = raw.updatedAt;
    return product;
  }

  static toResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
    };
  }
}

// src/infrastructure/persistence/typeorm/product.repository.ts
@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity) private repo: Repository<ProductEntity>
  ) {}

  async save(product: Product): Promise<Product> {
    const entity = ProductEntity.fromDomain(product);
    const saved = await this.repo.save(entity);
    return ProductMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findAll(skip: number, take: number): Promise<Product[]> {
    const entities = await this.repo.find({ skip, take });
    return entities.map((e) => ProductMapper.toDomain(e));
  }

  async update(id: string, product: Product): Promise<Product> {
    await this.repo.update(id, ProductEntity.fromDomain(product));
    const updated = await this.repo.findOne({ where: { id } });
    return ProductMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

// src/infrastructure/controllers/product.controller.ts
@Controller('products')
export class ProductController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.createProductUseCase.execute(dto);
    return ProductMapper.toResponse(product);
  }
}
```

### 4. Applied Principles

- ✅ **SRP:** Each class has one responsibility (Entity, UseCase, Repository)
- ✅ **OCP:** Easy to add new Use Cases without modifying existing ones
- ✅ **LSP:** Interchangeable Repositories (Mock vs Real)
- ✅ **ISP:** Specific interfaces (IProductRepository)
- ✅ **DIP:** Depend on IProductRepository, not on ProductRepository
- ✅ **DRY:** Reuse mappers, validators, exceptions

---

## Advanced Level Architecture

**For:** Social Media, Payment API, Notifications, Admin Dashboard
**Complexity:** High | **Scalability:** Production scalable

### 1. Pattern: Complete Clean Architecture + DDD

```
Presentation Layer
    ↓
Application Layer (Use Cases, Services, Queries, Commands)
    ↓
Domain Layer (Aggregates, Value Objects, Domain Events, Interfaces)
    ↓
Infrastructure Layer (Repositories, External Services, ORM Mappers)
    ↓
Database + External APIs
```

### 2. Additional Concepts

#### Domain Events

```typescript
// src/domain/events/domain.event.ts
export abstract class DomainEvent {
  public readonly occurredAt: Date = new Date();
  public readonly aggregateId: string;
}

// src/domain/events/user-registered.event.ts
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly name: string
  ) {
    super();
    this.aggregateId = aggregateId;
  }
}

// src/domain/entities/user.aggregate-root.ts
export class User extends AggregateRoot {
  private _email: Email;
  private _password: Password;
  private _name: string;

  static create(props: CreateUserProps): User {
    const user = new User(props);
    user.addDomainEvent(
      new UserRegisteredEvent(user.id, user.email.value, user.name)
    );
    return user;
  }

  // Getters with Value Objects
  get email(): Email {
    return this._email;
  }
}
```

#### Value Objects

```typescript
// src/domain/value-objects/email.value-object.ts
export class Email {
  private value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new InvalidEmailException();
    }
    this.value = email;
  }

  private isValid(email: string): boolean {
    // Complex validation
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) !== null;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

### 3. Advanced Folder Structure

```
src/
├── domain/
│   ├── aggregates/
│   │   └── user.aggregate-root.ts
│   ├── value-objects/
│   │   ├── email.value-object.ts
│   │   ├── password.value-object.ts
│   │   └── user-id.value-object.ts
│   ├── events/
│   │   ├── domain.event.ts
│   │   ├── user-registered.event.ts
│   │   └── user-deleted.event.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts
│   ├── services/
│   │   └── password-encoder.service.ts
│   └── exceptions/
│       └── domain.exceptions.ts
│
├── application/
│   ├── commands/
│   │   ├── create-user.command.ts
│   │   └── create-user.command-handler.ts
│   ├── queries/
│   │   ├── get-user-by-id.query.ts
│   │   └── get-user-by-id.query-handler.ts
│   ├── dto/
│   │   └── user-response.dto.ts
│   ├── services/
│   │   └── user.application-service.ts
│   ├── events/
│   │   └── user-registered.event-handler.ts
│   └── mappers/
│       └── user.mapper.ts
│
├── infrastructure/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── persistence/
│   │   ├── typeorm/
│   │   │   ├── user.entity.ts
│   │   │   └── user.repository.ts
│   │   └── mappers/
│   │       └── user.persistence.mapper.ts
│   ├── external-services/
│   │   ├── email-service.ts
│   │   └── sms-service.ts
│   ├── event-handlers/
│   │   └── user-registered.event-handler.ts
│   └── config/
│       ├── cqrs.config.ts
│       └── event-emitter.config.ts
│
└── app.module.ts
```

### 4. Example: CQRS + Domain Events (Advanced)

```typescript
// src/application/commands/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string
  ) {}
}

// src/application/commands/create-user.command-handler.ts
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // Verify unique email
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(command.email);
    }

    // Create aggregate
    const user = User.create({
      email: command.email,
      password: command.password,
      name: command.name,
    });

    // Persist
    await this.userRepository.save(user);

    // Publish domain events
    await this.eventBus.publishAll(user.getDomainEvents());

    return user;
  }
}

// src/application/queries/get-user-by-id.query.ts
export class GetUserByIdQuery {
  constructor(public readonly id: string) {}
}

// src/application/queries/get-user-by-id.query-handler.ts
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.userRepository.findById(query.id);
  }
}

// src/infrastructure/controllers/user.controller.ts
@Controller('users')
export class UserController {
  constructor(private readonly cqrs: CqrsModule) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto.email, dto.password, dto.name);
    const user = await this.cqrs.commandBus.execute(command);
    return UserMapper.toResponse(user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const query = new GetUserByIdQuery(id);
    const user = await this.cqrs.queryBus.execute(query);
    if (!user) throw new NotFoundException();
    return UserMapper.toResponse(user);
  }
}

// src/application/events/user-registered.event-handler.ts
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredEventHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserRegisteredEvent) {
    await this.emailService.sendWelcomeEmail(event.email, event.name);
  }
}
```

### 5. Applied Principles

- ✅ **Complete Clean Architecture:** All layers clearly separated
- ✅ **DDD:** Aggregates, Value Objects, Domain Events
- ✅ **CQRS:** Separation of Commands (write) and Queries (read)
- ✅ **Event-Driven:** Publish domain events
- ✅ **DIP:** Maximum decoupling
- ✅ **SRP:** Each class has one specific responsibility
- ✅ **DRY:** Reuse mappers, validators, events

---

## Expert Level Architecture

**For:** Microservices, Streaming, Multi-tenant SaaS, Recommendations
**Complexity:** Very High | **Scalability:** Distributed

### 1. Applied Patterns

- **Microservices Architecture**
- **Event Sourcing**
- **CQRS + Event Store**
- **API Gateway**
- **Service-to-Service Communication** (gRPC, Message Queue)
- **Distributed Transactions** (Saga Pattern)
- **Complete Domain-Driven Design**

### 2. Multi-Service Structure

```
microservices/
├── api-gateway/
│   ├── src/
│   │   ├── routes/
│   │   └── middleware/
│   └── package.json
│
├── user-service/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── package.json
│
├── product-service/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── package.json
│
├── order-service/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── package.json
│
├── shared/
│   ├── events/
│   │   ├── order.events.ts
│   │   ├── user.events.ts
│   │   └── payment.events.ts
│   ├── dto/
│   └── utils/
│
└── docker-compose.yml
```

### 3. Event Sourcing

```typescript
// shared/events/order.events.ts
export class OrderCreatedEvent implements DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public readonly total: number,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PaymentProcessedEvent implements DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

// order-service/src/infrastructure/persistence/event-store.ts
@Injectable()
export class EventStore {
  constructor(
    @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>
  ) {}

  async append(aggregateId: string, event: DomainEvent): Promise<void> {
    const eventEntity = new EventEntity({
      aggregateId,
      eventType: event.constructor.name,
      eventData: JSON.stringify(event),
      timestamp: new Date(),
    });
    await this.eventRepo.save(eventEntity);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const entities = await this.eventRepo.find({
      where: { aggregateId },
      order: { timestamp: 'ASC' },
    });
    return entities.map((e) => JSON.parse(e.eventData));
  }
}
```

### 4. Saga Pattern for Distributed Transactions

```typescript
// order-service/src/sagas/create-order.saga.ts
@Injectable()
export class CreateOrderSaga {
  constructor(private eventBus: EventBus, private commandBus: CommandBus) {
    this.eventBus.subscribe(OrderCreatedEvent, (event) =>
      this.onOrderCreated(event)
    );
    this.eventBus.subscribe(PaymentFailedEvent, (event) =>
      this.onPaymentFailed(event)
    );
  }

  private async onOrderCreated(event: OrderCreatedEvent) {
    // Step 1: Create order (already done)
    // Step 2: Process payment
    const command = new ProcessPaymentCommand(event.orderId, event.total);
    await this.commandBus.execute(command);
  }

  private async onPaymentFailed(event: PaymentFailedEvent) {
    // Compensation: Cancel order
    const command = new CancelOrderCommand(event.orderId);
    await this.commandBus.execute(command);
  }
}
```

### 5. Service-to-Service Communication

```typescript
// Asynchronous with Message Queue (RabbitMQ)
@Injectable()
export class EventPublisher {
  constructor(private amqpConnection: AmqpConnection) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.amqpConnection.publish(
      'domain-events',
      event.constructor.name,
      event
    );
  }
}

// Synchronous with gRPC
@Injectable()
export class UserServiceClient {
  private stub: UserService.Client;

  constructor() {
    this.stub = new UserService.Client('user-service:50051');
  }

  async getUser(id: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this.stub.getUser({ id }, (err, response) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }
}
```

---

## Dependency Injection

### Beginner Level: Simple DI

```typescript
@Module({
  providers: [UserService, UserRepository],
  controllers: [UserController],
})
export class UserModule {}

// In controller
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
}
```

### Intermediate Level: Advanced DI

```typescript
@Module({
  providers: [
    {
      provide: 'USER_REPOSITORY',
      useClass: PostgresUserRepository, // Change without modifying code
    },
    {
      provide: UserService,
      useFactory: (repo) => new UserService(repo),
      inject: ['USER_REPOSITORY'],
    },
  ],
})
export class UserModule {}
```

### Advanced Level: Complex DI

```typescript
@Module({
  providers: [
    {
      provide: IUserRepository,
      useClass: PostgresUserRepository,
    },
    {
      provide: 'PASSWORD_ENCODER',
      useValue: new BcryptPasswordEncoder(10),
    },
    {
      provide: CreateUserCommandHandler,
      useFactory: (repo, encoder) =>
        new CreateUserCommandHandler(repo, encoder),
      inject: [IUserRepository, 'PASSWORD_ENCODER'],
    },
  ],
})
export class UserModule {}
```

---

## Design Patterns

**Applicable design patterns by complexity level**

Design patterns are reusable solutions to common problems. Each level incorporates new patterns according to project complexity.

### Beginner Level Patterns

#### 1. **Repository Pattern** (Data Access)

**Problem:** Coupling business logic with database details

**Solution:** Abstract data access in a dedicated class

```typescript
// src/repositories/user.repository.ts
@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    await this.repo.update(id, user);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}

// src/services/user.service.ts
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async register(email: string, password: string): Promise<User> {
    const user = new User({ email, password });
    return this.userRepository.create(user);
  }
}
```

**Advantages:**

- ✅ Change database without affecting services
- ✅ Easy to mock for tests
- ✅ More testable code

---

#### 2. **Factory Pattern** (Object Creation)

**Problem:** Complex object creation logic

**Solution:** Dedicate a class/method to creation

```typescript
// src/factories/user.factory.ts
export class UserFactory {
  static create(data: CreateUserData): User {
    const user = new User();
    user.id = generateUUID();
    user.email = data.email;
    user.password = data.password;
    user.role = data.role || 'user';
    user.createdAt = new Date();
    return user;
  }

  static createAdmin(data: CreateUserData): User {
    const user = this.create(data);
    user.role = 'admin';
    return user;
  }

  static createBulk(dataArray: CreateUserData[]): User[] {
    return dataArray.map((data) => this.create(data));
  }
}

// Usage
const user = UserFactory.create({
  email: 'user@test.com',
  password: 'pass123',
});
const admin = UserFactory.createAdmin({
  email: 'admin@test.com',
  password: 'pass123',
});
```

**Advantages:**

- ✅ Centralized creation
- ✅ Easy to create variants
- ✅ Validation logic in one place

---

#### 3. **Singleton Pattern** (Global Instance)

**Problem:** Need a single global instance

**Solution:** Single lifecycle controller

```typescript
// src/config/jwt.config.ts
@Injectable({ scope: Scope.DEFAULT }) // Singleton
export class JwtConfig {
  private secret = process.env.JWT_SECRET;
  private expiration = process.env.JWT_EXPIRATION;

  getSecret(): string {
    return this.secret;
  }

  getExpiration(): string {
    return this.expiration;
  }
}

// NestJS handles this automatically with @Injectable()
// In module:
@Module({
  providers: [JwtConfig],
})
export class ConfigModule {}

// Usage
@Injectable()
export class AuthService {
  constructor(private jwtConfig: JwtConfig) {}

  async login(user: User) {
    const secret = this.jwtConfig.getSecret(); // Same instance always
    // ...
  }
}
```

**Advantages:**

- ✅ Single shared instance
- ✅ Memory efficient
- ✅ Easy to test

---

#### 4. **Decorator Pattern** (Add Behavior)

**Problem:** Add functionality to methods without modifying their code

**Solution:** Use decorators for cross-cutting concerns

```typescript
// src/common/decorators/validate-email.decorator.ts
export function ValidateEmail() {
  return ValidateIf((o) => o.email !== undefined);
}

// src/common/decorators/require-permission.decorator.ts
export function RequirePermission(...permissions: string[]) {
  return SetMetadata('permissions', permissions);
}

// src/common/decorators/cache.decorator.ts
export function Cache(ttl: number) {
  return SetMetadata('cache:ttl', ttl);
}

// Usage in DTO
export class CreateUserDto {
  @ValidateEmail()
  email: string;

  @MinLength(8)
  password: string;
}

// Usage in controller
@Controller('users')
export class UserController {
  @Get(':id')
  @Cache(3600) // Cache for 1 hour
  async getUser(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post('admin')
  @RequirePermission('ADMIN')
  async createAdmin(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

**Advantages:**

- ✅ Clean and readable code
- ✅ Reusable in multiple places
- ✅ Separation of concerns

---

### Intermediate Level Patterns

#### 5. **Strategy Pattern** (Algorithm Selection)

**Problem:** Multiple ways to do something (e.g., pay, validate, send)

**Solution:** Family of interchangeable algorithms

```typescript
// src/domain/strategies/payment.strategy.ts
export interface IPaymentStrategy {
  process(amount: number): Promise<PaymentResult>;
  refund(transactionId: string): Promise<void>;
}

// src/infrastructure/payment/stripe.strategy.ts
@Injectable()
export class StripePaymentStrategy implements IPaymentStrategy {
  constructor(private stripeClient: Stripe) {}

  async process(amount: number): Promise<PaymentResult> {
    const payment = await this.stripeClient.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });
    return { transactionId: payment.id, status: 'processing' };
  }

  async refund(transactionId: string): Promise<void> {
    await this.stripeClient.refunds.create({ charge: transactionId });
  }
}

// src/infrastructure/payment/paystack.strategy.ts
@Injectable()
export class PaystackPaymentStrategy implements IPaymentStrategy {
  constructor(private paystackClient: Paystack) {}

  async process(amount: number): Promise<PaymentResult> {
    const payment = await this.paystackClient.transaction.initialize({
      amount: amount * 100,
      email: 'customer@example.com',
    });
    return { transactionId: payment.reference, status: 'initialized' };
  }

  async refund(transactionId: string): Promise<void> {
    await this.paystackClient.refund.create({ reference: transactionId });
  }
}

// src/application/services/payment.service.ts
@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_STRATEGY') private paymentStrategy: IPaymentStrategy
  ) {}

  async processPayment(amount: number): Promise<PaymentResult> {
    return this.paymentStrategy.process(amount);
  }
}

// In module, change strategy without modifying code
@Module({
  providers: [
    {
      provide: 'PAYMENT_STRATEGY',
      useClass:
        process.env.PAYMENT_PROVIDER === 'stripe'
          ? StripePaymentStrategy
          : PaystackPaymentStrategy,
    },
  ],
})
export class PaymentModule {}
```

**Advantages:**

- ✅ Change algorithms at runtime
- ✅ Easy to add new strategies
- ✅ No if/else conditionals

---

#### 6. **Observer Pattern** (Event Publishing)

**Problem:** Notify multiple objects when something happens

**Solution:** Publish-subscribe system

```typescript
// src/domain/events/user.events.ts
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

// src/application/observers/send-welcome-email.observer.ts
@Injectable()
export class SendWelcomeEmailObserver {
  constructor(private emailService: EmailService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.emailService.sendWelcome(event.email);
  }
}

// src/application/observers/create-user-profile.observer.ts
@Injectable()
export class CreateUserProfileObserver {
  constructor(private profileService: ProfileService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.profileService.create(event.userId);
  }
}

// src/application/services/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private eventEmitter: EventEmitter2,
    private userRepository: UserRepository
  ) {}

  async register(email: string, password: string): Promise<User> {
    const user = new User({ email, password });
    await this.userRepository.create(user);

    // Emit event
    const event = new UserRegisteredEvent(user.id, user.email);
    this.eventEmitter.emit('user.registered', event);

    return user;
  }
}

// In module
@Module({
  providers: [UserService, SendWelcomeEmailObserver, CreateUserProfileObserver],
})
export class UserModule {}
```

**Advantages:**

- ✅ Event decoupling
- ✅ Multiple listeners without modifying service
- ✅ Easy to test

---

#### 7. **Adapter Pattern** (Interface Translation)

**Problem:** Integrate systems with incompatible interfaces

**Solution:** Create adapter that translates interfaces

```typescript
// External interface
export interface ExternalPaymentAPI {
  makePayment(
    cardData: string,
    amount: number
  ): Promise<{ id: string; success: boolean }>;
}

// Our interface
export interface IPaymentService {
  process(amount: number): Promise<PaymentResult>;
}

// Adapter
@Injectable()
export class PaymentAdapter implements IPaymentService {
  constructor(private externalAPI: ExternalPaymentAPI) {}

  async process(amount: number): Promise<PaymentResult> {
    try {
      const result = await this.externalAPI.makePayment(
        process.env.CARD_DATA,
        amount * 100 // Convert to cents
      );

      return {
        transactionId: result.id,
        status: result.success ? 'completed' : 'failed',
        amount,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}
```

**Advantages:**

- ✅ Integrate without modifying external code
- ✅ Easily change providers
- ✅ Hide complexity

---

#### 8. **Builder Pattern** (Complex Object Construction)

**Problem:** Create complex objects with many options

**Solution:** Step by step with builder

```typescript
// src/application/builders/report.builder.ts
export class ReportBuilder {
  private report: Partial<Report> = {};

  setTitle(title: string): this {
    this.report.title = title;
    return this;
  }

  setDateRange(startDate: Date, endDate: Date): this {
    this.report.startDate = startDate;
    this.report.endDate = endDate;
    return this;
  }

  addFilter(filter: ReportFilter): this {
    this.report.filters = [...(this.report.filters || []), filter];
    return this;
  }

  setFormat(format: 'pdf' | 'csv' | 'json'): this {
    this.report.format = format;
    return this;
  }

  includeCharts(): this {
    this.report.includeCharts = true;
    return this;
  }

  build(): Report {
    if (!this.report.title) {
      throw new Error('Title is required');
    }
    return this.report as Report;
  }
}

// Usage
const report = new ReportBuilder()
  .setTitle('Sales Report')
  .setDateRange(new Date('2026-01-01'), new Date('2026-01-31'))
  .addFilter({ field: 'category', value: 'electronics' })
  .setFormat('pdf')
  .includeCharts()
  .build();
```

**Advantages:**

- ✅ Clear and readable construction
- ✅ Validation at each step
- ✅ Native optional parameters

---

#### 9. **Facade Pattern** (Simplify Complex Subsystem)

**Problem:** Complex subsystem with many classes

**Solution:** Simple interface that hides complexity

```typescript
// Complex subsystem
@Injectable()
export class PaymentProcessor {
  /* ... */
}

@Injectable()
export class InvoiceGenerator {
  /* ... */
}

@Injectable()
export class EmailNotifier {
  /* ... */
}

@Injectable()
export class InventoryManager {
  /* ... */
}

// Facade
@Injectable()
export class OrderFacade {
  constructor(
    private paymentProcessor: PaymentProcessor,
    private invoiceGenerator: InvoiceGenerator,
    private emailNotifier: EmailNotifier,
    private inventoryManager: InventoryManager
  ) {}

  async processOrder(orderId: string): Promise<void> {
    // Orchestrate complexity
    const order = await this.getOrder(orderId);

    // 1. Process payment
    const payment = await this.paymentProcessor.process(order.total);

    // 2. Update inventory
    await this.inventoryManager.reduceStock(order.items);

    // 3. Generate invoice
    const invoice = await this.invoiceGenerator.generate(order);

    // 4. Notify
    await this.emailNotifier.sendInvoice(order.customerEmail, invoice);
  }
}

// Client only calls facade
@Injectable()
export class OrderService {
  constructor(private orderFacade: OrderFacade) {}

  async placeOrder(orderId: string): Promise<void> {
    await this.orderFacade.processOrder(orderId); // Simple interface
  }
}
```

**Advantages:**

- ✅ Simple interface for complex subsystem
- ✅ Client decoupling
- ✅ Easy maintenance

---

#### 10. **Chain of Responsibility Pattern** (Request Handling)

**Problem:** Multiple handlers that process a request

**Solution:** Chain of handlers that pass the request along

```typescript
// src/common/pipes/validation.pipe.ts
export abstract class ValidationHandler {
  protected nextHandler?: ValidationHandler;

  setNext(handler: ValidationHandler): ValidationHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(data: any): Promise<void> {
    await this.validate(data);

    if (this.nextHandler) {
      await this.nextHandler.handle(data);
    }
  }

  protected abstract validate(data: any): Promise<void>;
}

export class EmailValidator extends ValidationHandler {
  protected async validate(data: any): Promise<void> {
    if (!data.email.includes('@')) {
      throw new BadRequestException('Invalid email');
    }
  }
}

export class PasswordValidator extends ValidationHandler {
  protected async validate(data: any): Promise<void> {
    if (data.password.length < 8) {
      throw new BadRequestException('Password too short');
    }
  }
}

export class UniqueEmailValidator extends ValidationHandler {
  constructor(private userRepository: UserRepository) {
    super();
  }

  protected async validate(data: any): Promise<void> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
  }
}

// Usage
const validationChain = new EmailValidator();
validationChain
  .setNext(new PasswordValidator())
  .setNext(new UniqueEmailValidator(userRepository));

await validationChain.handle({ email: 'test@test.com', password: 'secure123' });
```

**Advantages:**

- ✅ Decoupled handlers
- ✅ Easy to add/remove handlers
- ✅ Flexible order

---

### Advanced Level Patterns

#### 11. **Mediator Pattern** (Reduce Coupling)

**Problem:** Many objects communicating directly (spaghetti code)

**Solution:** Central mediator that manages communications

```typescript
// src/domain/mediators/order.mediator.ts
export interface OrderMediator {
  onOrderCreated(order: Order): Promise<void>;
  onPaymentProcessed(orderId: string): Promise<void>;
  onInventoryUpdated(orderId: string): Promise<void>;
}

@Injectable()
export class OrderMediatorImpl implements OrderMediator {
  constructor(
    private paymentService: PaymentService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService
  ) {}

  async onOrderCreated(order: Order): Promise<void> {
    // Mediator coordinates actions
    const payment = await this.paymentService.process(order);

    if (payment.success) {
      await this.inventoryService.reduce(order.items);
      await this.notificationService.notifyCustomer(order);
      await this.analyticsService.trackOrder(order);
    }
  }

  async onPaymentProcessed(orderId: string): Promise<void> {
    // Coordination logic
    const order = await this.getOrder(orderId);
    await this.inventoryService.confirm(orderId);
  }
}

// Objects don't communicate directly
@Injectable()
export class Order {
  constructor(private mediator: OrderMediator) {}

  async create(): Promise<void> {
    // Does not call other services directly
    await this.mediator.onOrderCreated(this);
  }
}
```

**Advantages:**

- ✅ Reduce coupling
- ✅ Central orchestration logic
- ✅ Easy to test

---

#### 12. **State Pattern** (Object Behavior Change)

**Problem:** Different behavior based on state

**Solution:** States as interchangeable objects

```typescript
// src/domain/states/order.state.ts
export interface OrderState {
  approve(): Promise<void>;
  reject(): Promise<void>;
  ship(): Promise<void>;
  cancel(): Promise<void>;
}

export class PendingState implements OrderState {
  constructor(private order: Order) {}

  async approve(): Promise<void> {
    // Change to approved
    this.order.setState(new ApprovedState(this.order));
  }

  async reject(): Promise<void> {
    // Change to rejected
    this.order.setState(new RejectedState(this.order));
  }

  async ship(): Promise<void> {
    throw new Error('Cannot ship pending order');
  }

  async cancel(): Promise<void> {
    this.order.setState(new CancelledState(this.order));
  }
}

export class ApprovedState implements OrderState {
  constructor(private order: Order) {}

  async approve(): Promise<void> {
    throw new Error('Already approved');
  }

  async ship(): Promise<void> {
    this.order.setState(new ShippedState(this.order));
  }
}

// Context
export class Order {
  private state: OrderState;

  constructor() {
    this.state = new PendingState(this);
  }

  setState(state: OrderState): void {
    this.state = state;
  }

  async approve(): Promise<void> {
    await this.state.approve();
  }

  async ship(): Promise<void> {
    await this.state.ship();
  }
}
```

**Advantages:**

- ✅ States as objects
- ✅ Clear transitions
- ✅ No complex switch/if statements

---

#### 13. **Template Method Pattern** (Algorithm Structure)

**Problem:** Multiple classes with similar steps but different details

**Solution:** Structure in base class, details in subclasses

```typescript
// src/application/export/base.exporter.ts
export abstract class BaseExporter {
  async export(data: any[]): Promise<Buffer> {
    // Template method - fixed structure
    const validated = this.validateData(data);
    const transformed = this.transformData(validated);
    const formatted = this.formatData(transformed);
    const buffer = this.generateBuffer(formatted);

    return buffer;
  }

  protected validateData(data: any[]): any[] {
    // Common validation
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }
    return data;
  }

  protected abstract transformData(data: any[]): any[];
  protected abstract formatData(data: any[]): any;
  protected abstract generateBuffer(formatted: any): Promise<Buffer>;
}

export class PdfExporter extends BaseExporter {
  protected transformData(data: any[]): any[] {
    return data.map((item) => ({
      ...item,
      exportedAt: new Date(),
    }));
  }

  protected formatData(data: any[]): any {
    return this.createPdfDocument(data);
  }

  protected async generateBuffer(formatted: any): Promise<Buffer> {
    return formatted.getBuffer();
  }
}

export class CsvExporter extends BaseExporter {
  protected transformData(data: any[]): any[] {
    return data;
  }

  protected formatData(data: any[]): any {
    return this.convertToCsv(data);
  }

  protected async generateBuffer(formatted: string): Promise<Buffer> {
    return Buffer.from(formatted, 'utf-8');
  }
}
```

**Advantages:**

- ✅ Reuse structure
- ✅ Controlled variations
- ✅ Centralized changes

---

### Expert Level Patterns

#### 14. **CQRS Pattern** (Command Query Responsibility Segregation)

**Problem:** Read/write logic together causes complexity

**Solution:** Separate Commands (write) from Queries (read)

```typescript
// src/application/commands/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const user = User.create(command);
    await this.userRepository.save(user);
    await this.eventBus.publishAll(user.getDomainEvents());
    return user;
  }
}

// src/application/queries/get-user.query.ts
export class GetUserQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler {
  constructor(private userRepository: IUserRepository) {}

  async execute(query: GetUserQuery): Promise<User> {
    return this.userRepository.findById(query.id);
  }
}

// In controller
@Controller('users')
export class UserController {
  constructor(private cqrs: CqrsModule) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto.email, dto.password);
    return this.cqrs.commandBus.execute(command);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const query = new GetUserQuery(id);
    return this.cqrs.queryBus.execute(query);
  }
}
```

**Advantages:**

- ✅ Separate scalability
- ✅ Optimize reads with replicas
- ✅ Event sourcing compatible

---

#### 15. **Event Sourcing Pattern** (Store State as Events)

**Problem:** Losing change history, difficult debugging

**Solution:** Store events, reconstruct state from events

```typescript
// src/domain/events/user.events.ts
export abstract class DomainEvent {
  public readonly occurredAt: Date = new Date();
  public readonly aggregateId: string;
}

export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly name: string
  ) {
    super();
    this.aggregateId = aggregateId;
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly newPasswordHash: string) {
    super();
    this.aggregateId = aggregateId;
  }
}

// src/infrastructure/event-store/event.store.ts
@Injectable()
export class EventStore {
  constructor(
    @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>
  ) {}

  async append(aggregateId: string, event: DomainEvent): Promise<void> {
    const eventEntity = new EventEntity({
      aggregateId,
      eventType: event.constructor.name,
      eventData: JSON.stringify(event),
      occurredAt: event.occurredAt,
    });
    await this.eventRepo.save(eventEntity);
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const entities = await this.eventRepo.find({
      where: { aggregateId },
      order: { occurredAt: 'ASC' },
    });
    return entities.map((e) => JSON.parse(e.eventData));
  }

  async getAllEventsSince(since: Date): Promise<DomainEvent[]> {
    const entities = await this.eventRepo.find({
      where: { occurredAt: MoreThan(since) },
      order: { occurredAt: 'ASC' },
    });
    return entities.map((e) => JSON.parse(e.eventData));
  }
}

// src/domain/entities/user.aggregate.ts
export class User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;

  static create(email: string, passwordHash: string): User {
    const user = new User();
    user.id = generateId();
    user.email = email;
    user.passwordHash = passwordHash;
    user.createdAt = new Date();
    return user;
  }

  static fromHistory(events: DomainEvent[]): User {
    const user = new User();

    events.forEach((event) => {
      if (event instanceof UserCreatedEvent) {
        user.id = event.aggregateId;
        user.email = event.email;
        user.createdAt = event.occurmedAt;
      } else if (event instanceof UserPasswordChangedEvent) {
        user.passwordHash = event.newPasswordHash;
      }
    });

    return user;
  }
}

// src/infrastructure/repositories/event-sourced-user.repository.ts
@Injectable()
export class EventSourcedUserRepository {
  constructor(private eventStore: EventStore) {}

  async save(user: User): Promise<void> {
    // Save only events
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventStore.append(user.id, event);
    }
  }

  async findById(id: string): Promise<User | null> {
    // Reconstruct from events
    const events = await this.eventStore.getEvents(id);
    if (events.length === 0) return null;
    return User.fromHistory(events);
  }
}
```

**Advantages:**

- ✅ Complete change history
- ✅ Improved debugging
- ✅ Time travel (temporal queries)
- ✅ Automatic auditing

---

#### 16. **Circuit Breaker Pattern** (Fault Tolerance)

**Problem:** Calls to external services fail, causing cascade

**Solution:** Circuit breaker that detects failures and opens circuit

```typescript
// src/common/circuit-breaker/circuit-breaker.ts
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;

  constructor(
    private threshold = 5, // Failures before opening
    private resetTimeout = 60000 // Time before attempting recovery
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime.getTime()) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = new Date(Date.now() + this.resetTimeout);
    }
  }
}

// Usage in service
@Injectable()
export class PaymentService {
  private circuitBreaker = new CircuitBreaker(5, 60000);

  async processPayment(amount: number): Promise<PaymentResult> {
    return this.circuitBreaker.execute(async () => {
      return this.externalPaymentAPI.process(amount);
    });
  }
}
```

**Advantages:**

- ✅ Avoid failure cascades
- ✅ Automatic recovery
- ✅ Intelligent timeouts

---

#### 17. **Saga Pattern** (Distributed Transactions)

**Problem:** Transactions that cross multiple services

**Solution:** Orchestrate compensations in case of error

```typescript
// src/sagas/create-order.saga.ts
@Injectable()
export class CreateOrderSaga {
  constructor(private eventBus: EventBus, private commandBus: CommandBus) {
    this.eventBus.subscribe(OrderCreatedEvent, (event) =>
      this.onOrderCreated(event)
    );
    this.eventBus.subscribe(PaymentFailedEvent, (event) =>
      this.onPaymentFailed(event)
    );
  }

  private async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Step 1: Process payment
    try {
      const paymentCommand = new ProcessPaymentCommand(
        event.orderId,
        event.total
      );
      await this.commandBus.execute(paymentCommand);
    } catch (error) {
      // Compensation: Cancel order
      const cancelCommand = new CancelOrderCommand(event.orderId);
      await this.commandBus.execute(cancelCommand);
      throw error;
    }
  }

  private async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Automatic compensation
    const cancelCommand = new CancelOrderCommand(event.orderId);
    await this.commandBus.execute(cancelCommand);
  }
}
```

**Advantages:**

- ✅ Distributed transactions
- ✅ Automatic compensations
- ✅ Eventual consistency guaranteed

---

## Patterns Summary by Level

```typescript
// BEGINNER
- Repository        ✅ (data access)
- Factory           ✅ (create objects)
- Singleton         ✅ (single instance)
- Decorator         ✅ (additional behavior)

// INTERMEDIATE
- Strategy          ✅ (interchangeable algorithms)
- Observer          ✅ (notifications)
- Adapter           ✅ (integration)
- Builder           ✅ (complex construction)
- Facade            ✅ (simplify subsystem)
- Chain of Resp.    ✅ (sequential processing)

// ADVANCED
- Mediator          ✅ (reduce coupling)
- State             ✅ (behavior change)
- Template Method   ✅ (common structure)
- Visitor           ✅ (operations on structures)

// EXPERT
- CQRS              ✅ (separate read/write)
- Event Sourcing    ✅ (state as events)
- Circuit Breaker   ✅ (fault tolerance)
- Saga              ✅ (distributed transactions)
- API Gateway       ✅ (single entry point)
- Strangler Fig     ✅ (gradual migration)
```

---

## When NOT to Use Patterns

**Warning: Avoid over-engineering:**

```typescript
// ❌ BAD: Factory for a simple constructor
export class UserFactory {
  static create(data: CreateUserData): User {
    return new User(data);
  }
}

// ✅ GOOD: Direct constructor
const user = new User(data);
```

```typescript
// ❌ BAD: Observer for a simple function
this.eventEmitter.on('user.created', () => sendEmail());

// ✅ GOOD: Call directly if it's simple
await sendWelcomeEmail(user);
```

**Golden rule:**

- Use patterns when **they solve a real problem**
- Don't anticipate problems you don't have
- Refactor to patterns when necessary

---

**Last updated:** 2026-01-02

### Beginner: Simple Unit Tests

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    service = new UserService(repository);
  });

  it('should register user with valid email', async () => {
    jest.spyOn(repository, 'findByEmail').mockResolvedValue(null);
    jest
      .spyOn(repository, 'create')
      .mockResolvedValue({ id: '1', email: 'test@test.com' });

    const result = await service.register('test@test.com', 'pass123', 'Test');

    expect(result.email).toBe('test@test.com');
  });
});
```

### Intermediate: Tests with Mocks and Integration

```typescript
describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepository: IProductRepository;
  let categoryRepository: ICategoryRepository;

  beforeEach(() => {
    const module = createMockModule({
      providers: [
        { provide: IProductRepository, useValue: createMockRepository() },
        { provide: ICategoryRepository, useValue: createMockRepository() },
      ],
    });
    useCase = module.get(CreateProductUseCase);
  });

  it('should create product when category exists', async () => {
    // Arrange
    const command = new CreateProductCommand(...);
    // Act
    const result = await useCase.execute(command);
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Advanced: Complete E2E Tests

```typescript
describe('Product API E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  });

  it('POST /products should create product', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Test Product', price: 10, categoryId: 'cat-1' })
      .expect(201);

    expect(response.body.id).toBeDefined();
  });
});
```

---

## Comparative Summary

| Aspect                | Beginner  | Intermediate       | Advanced          | Expert           |
| --------------------- | --------- | ------------------ | ----------------- | ---------------- |
| **Layers**            | 3         | 4                  | 5+                | Distributed      |
| **Entities**          | ORM Models | Domain + ORM      | Aggregates        | Event Sourced    |
| **Business Logic**    | Services  | Use Cases          | CQRS              | Event-Driven     |
| **Validation**        | DTO       | DTO + Domain       | Value Objects     | Event Validation |
| **Testing**           | Unit      | Unit + Integration | Unit + Int + E2E  | Complete         |
| **Scalability**       | Local     | Monolith           | Scaled monolith   | Distributed      |
| **Complexity**        | Low       | Medium             | High              | Very High        |
| **Patterns**          | 4         | 10                 | 13                | 17               |
| **Learning time**     | 1 week    | 2 weeks            | 1 month           | 2-3 months       |

---

## Design Patterns by Level

| Pattern             | Beginner | Intermediate | Advanced | Expert | Purpose                    |
| ------------------- | -------- | ------------ | -------- | ------ | -------------------------- |
| **Repository**      | ✅       | ✅           | ✅       | ✅     | Data abstraction           |
| **Factory**         | ✅       | ✅           | ✅       | ✅     | Object creation            |
| **Singleton**       | ✅       | ✅           | ✅       | ✅     | Single instance            |
| **Decorator**       | ✅       | ✅           | ✅       | ✅     | Additional behavior        |
| **Strategy**        |          | ✅           | ✅       | ✅     | Interchangeable algorithms |
| **Observer**        |          | ✅           | ✅       | ✅     | Publish-subscribe          |
| **Adapter**         |          | ✅           | ✅       | ✅     | Integration                |
| **Builder**         |          | ✅           | ✅       | ✅     | Complex construction       |
| **Facade**          |          | ✅           | ✅       | ✅     | Simplify subsystem         |
| **Chain of Resp.**  |          | ✅           | ✅       | ✅     | Sequential processing      |
| **Mediator**        |          |              | ✅       | ✅     | Reduce coupling            |
| **State**           |          |              | ✅       | ✅     | Behavior change            |
| **Template Method** |          |              | ✅       | ✅     | Common structure           |
| **Visitor**         |          |              | ✅       | ✅     | Operations on structures   |
| **CQRS**            |          |              |          | ✅     | Separate read/write        |
| **Event Sourcing**  |          |              |          | ✅     | State as events            |
| **Circuit Breaker** |          |              |          | ✅     | Fault tolerance            |
| **Saga**            |          |              |          | ✅     | Distributed transactions   |

---

**Last updated:** 2026-01-02
**Maintenance:** Review every 3 months
