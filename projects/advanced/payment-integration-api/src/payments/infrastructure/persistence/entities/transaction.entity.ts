import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';

export type TransactionType = 'charge' | 'refund' | 'dispute';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  paymentId: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.transactions)
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity;

  @Column({
    type: 'enum',
    enum: ['charge', 'refund', 'dispute'],
  })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending',
  })
  status: TransactionStatus;

  @Column('varchar', { nullable: true })
  externalId: string | null;

  @Column('text', { nullable: true })
  failureReason: string | null;

  @Column('jsonb', { nullable: true })
  providerResponse: Record<string, unknown> | null;

  @CreateDateColumn()
  timestamp: Date;
}
