import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

export type NotificationType = 'follow' | 'like' | 'comment';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  type: NotificationType;

  @Column('uuid')
  actorId: string;

  @Column('uuid')
  targetId: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.actedNotifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actorId' })
  actor: UserEntity;
}
