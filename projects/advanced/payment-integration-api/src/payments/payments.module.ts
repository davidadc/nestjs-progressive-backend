import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import type { ConfigType } from '@nestjs/config';

// Config
import paymentConfig from '../config/payment.config';

// Domain
import { PAYMENT_REPOSITORY, TRANSACTION_REPOSITORY, WEBHOOK_EVENT_REPOSITORY } from './domain';

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
import {
  PAYMENT_STRATEGY,
  StripePaymentStrategy,
  PaystackPaymentStrategy,
  PaymentStrategyFactory,
} from './application/strategies';

// Application - Services
import { WebhookRetryService } from './application/services';

// Infrastructure - Entities
import {
  PaymentEntity,
  TransactionEntity,
  WebhookEventEntity,
} from './infrastructure/persistence/entities';

// Infrastructure - Repositories
import {
  PaymentRepository,
  TransactionRepository,
  WebhookEventRepository,
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
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([PaymentEntity, TransactionEntity, WebhookEventEntity]),
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
    {
      provide: WEBHOOK_EVENT_REPOSITORY,
      useClass: WebhookEventRepository,
    },
    // Payment Strategies (both available for factory)
    StripePaymentStrategy,
    PaystackPaymentStrategy,
    PaymentStrategyFactory,
    // Dynamic Payment Strategy Provider (based on config)
    {
      provide: PAYMENT_STRATEGY,
      useFactory: (
        config: ConfigType<typeof paymentConfig>,
        stripeStrategy: StripePaymentStrategy,
        paystackStrategy: PaystackPaymentStrategy,
      ) => {
        switch (config.provider) {
          case 'paystack':
            return paystackStrategy;
          case 'stripe':
          default:
            return stripeStrategy;
        }
      },
      inject: [paymentConfig.KEY, StripePaymentStrategy, PaystackPaymentStrategy],
    },
    // Services
    WebhookRetryService,
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [
    PAYMENT_REPOSITORY,
    TRANSACTION_REPOSITORY,
    WEBHOOK_EVENT_REPOSITORY,
    PaymentStrategyFactory,
    WebhookRetryService,
  ],
})
export class PaymentsModule {}
