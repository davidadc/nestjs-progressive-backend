import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CartItemOrmEntity } from './cart-item.orm-entity';
import { UserOrmEntity } from '../../../auth/infrastructure/persistence/user.orm-entity';

@Entity('carts')
export class CartOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @OneToMany(() => CartItemOrmEntity, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItemOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
