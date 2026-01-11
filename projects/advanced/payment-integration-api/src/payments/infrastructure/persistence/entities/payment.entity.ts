import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TransactionEntity } from './transaction.entity';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';
export type PaymentProvider = 'stripe' | 'paystack';

@Entity('payments')
export class PaymentEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: ['stripe', 'paystack'],
    default: 'stripe',
  })
  provider: PaymentProvider;

  @Column('varchar', { nullable: true })
  externalId: string | null;

  @Column('varchar', { nullable: true })
  checkoutUrl: string | null;

  @Column('text', { nullable: true })
  failureReason: string | null;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.payment, {
    cascade: true,
  })
  transactions: TransactionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date | null;
}
