import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain
import { PAYMENT_REPOSITORY, TRANSACTION_REPOSITORY } from './domain';

// Application - Commands
import {
  InitiatePaymentHandler,
  ProcessWebhookHandler,
  RefundPaymentHandler,
} from './application/commands';

// Application - Queries
import {
  GetPaymentStatusHandler,
  GetPaymentByIdHandler,
  ListTransactionsHandler,
} from './application/queries';

// Application - Event Handlers
import {
  PaymentCompletedHandler,
  PaymentFailedHandler,
  PaymentRefundedHandler,
} from './application/event-handlers';

// Application - Strategies
import { PAYMENT_STRATEGY, StripePaymentStrategy } from './application/strategies';

// Infrastructure - Entities
import { PaymentEntity, TransactionEntity } from './infrastructure/persistence/entities';

// Infrastructure - Repositories
import {
  PaymentRepository,
  TransactionRepository,
} from './infrastructure/persistence/repositories';

// Infrastructure - Controllers
import { PaymentController, WebhookController } from './infrastructure/controllers';

const CommandHandlers = [
  InitiatePaymentHandler,
  ProcessWebhookHandler,
  RefundPaymentHandler,
];

const QueryHandlers = [
  GetPaymentStatusHandler,
  GetPaymentByIdHandler,
  ListTransactionsHandler,
];

const EventHandlers = [
  PaymentCompletedHandler,
  PaymentFailedHandler,
  PaymentRefundedHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PaymentEntity, TransactionEntity]),
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    // Repositories
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
    // Payment Strategy
    {
      provide: PAYMENT_STRATEGY,
      useClass: StripePaymentStrategy,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [PAYMENT_REPOSITORY, TRANSACTION_REPOSITORY],
})
export class PaymentsModule {}
