import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddWebhookEvents1736600400000 implements MigrationInterface {
  name = 'AddWebhookEvents1736600400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'webhook_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'external_event_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'payload',
            type: 'text',
          },
          {
            name: 'signature',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'max_retries',
            type: 'int',
            default: 5,
          },
          {
            name: 'next_retry_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index for retry queue processing
    await queryRunner.createIndex(
      'webhook_events',
      new TableIndex({
        name: 'IDX_webhook_events_status_next_retry',
        columnNames: ['status', 'next_retry_at'],
      }),
    );

    // Create unique index for deduplication
    await queryRunner.createIndex(
      'webhook_events',
      new TableIndex({
        name: 'IDX_webhook_events_provider_external_id',
        columnNames: ['provider', 'external_event_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'webhook_events',
      'IDX_webhook_events_provider_external_id',
    );
    await queryRunner.dropIndex(
      'webhook_events',
      'IDX_webhook_events_status_next_retry',
    );
    await queryRunner.dropTable('webhook_events');
  }
}
