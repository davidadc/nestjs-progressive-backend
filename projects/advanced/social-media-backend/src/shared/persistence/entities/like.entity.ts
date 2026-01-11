import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

export type LikeTargetType = 'post' | 'comment';

@Entity('likes')
@Unique(['userId', 'targetId', 'targetType'])
@Index(['targetId', 'targetType'])
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  targetId: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  targetType: LikeTargetType;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // Note: post and comment relations are polymorphic (targetId + targetType)
  // No FK constraint on targetId since it can reference either posts or comments
}
