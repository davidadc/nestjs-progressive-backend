import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserOrmEntity } from '../../../auth/infrastructure/persistence/user.orm-entity';
import { ProductOrmEntity } from '../../../products/infrastructure/persistence/product.orm-entity';

@Entity('reviews')
@Unique(['userId', 'productId']) // One review per user per product
export class ReviewOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @Column({ name: 'user_name' })
  userName: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;

  @Column('int')
  rating: number; // 1-5

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
