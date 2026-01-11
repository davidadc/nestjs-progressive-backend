import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1736596800000 implements MigrationInterface {
  name = 'InitialSchema1736596800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create order_status enum
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled')
    `);

    // Create payment_status enum
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded')
    `);

    // Create payment_provider enum
    await queryRunner.query(`
      CREATE TYPE "payment_provider_enum" AS ENUM ('stripe', 'paystack')
    `);

    // Create transaction_type enum
    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM ('charge', 'refund', 'dispute')
    `);

    // Create transaction_status enum
    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'succeeded', 'failed')
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "totalAmount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "status" "order_status_enum" NOT NULL DEFAULT 'pending',
        "paymentId" uuid,
        "items" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "provider" "payment_provider_enum" NOT NULL DEFAULT 'stripe',
        "externalId" varchar,
        "checkoutUrl" varchar,
        "failureReason" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL,
        "paymentId" uuid NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
        "externalId" varchar,
        "failureReason" varchar,
        "providerResponse" jsonb,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_status" ON "orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_orderId" ON "payments" ("orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_externalId" ON "payments" ("externalId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_paymentId" ON "transactions" ("paymentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_transactions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_paymentId"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_externalId"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_orderId"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "orders"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE "payment_provider_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
