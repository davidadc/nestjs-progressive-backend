import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddIdempotencyKeys1736604000000 implements MigrationInterface {
  name = 'AddIdempotencyKeys1736604000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'idempotency_keys',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'request_hash',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status_code',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'processing'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'idempotency_keys',
      new TableIndex({
        name: 'IDX_idempotency_keys_key',
        columnNames: ['key'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'idempotency_keys',
      new TableIndex({
        name: 'IDX_idempotency_keys_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'idempotency_keys',
      'IDX_idempotency_keys_expires_at',
    );
    await queryRunner.dropIndex('idempotency_keys', 'IDX_idempotency_keys_key');
    await queryRunner.dropTable('idempotency_keys');
  }
}
