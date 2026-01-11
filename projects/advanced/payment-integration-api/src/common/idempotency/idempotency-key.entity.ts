import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('idempotency_keys')
@Index(['key'], { unique: true })
@Index(['expiresAt'])
export class IdempotencyKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'varchar', length: 64, name: 'request_hash' })
  requestHash: string;

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @Column({ type: 'int', name: 'status_code', nullable: true })
  statusCode: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'processing',
  })
  status: 'processing' | 'completed' | 'failed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;
}
