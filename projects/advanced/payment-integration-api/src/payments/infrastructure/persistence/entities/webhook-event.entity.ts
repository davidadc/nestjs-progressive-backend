import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type WebhookEventStatus =
  | 'pending'
  | 'processed'
  | 'failed'
  | 'retrying'
  | 'dead_letter';

@Entity('webhook_events')
@Index(['status', 'nextRetryAt'])
@Index(['provider', 'externalEventId'], { unique: true })
export class WebhookEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: 'stripe' | 'paystack';

  @Column({ type: 'varchar', length: 255, name: 'external_event_id' })
  externalEventId: string;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType: string;

  @Column({ type: 'text' })
  payload: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signature: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: WebhookEventStatus;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'int', default: 5, name: 'max_retries' })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true, name: 'next_retry_at' })
  nextRetryAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
