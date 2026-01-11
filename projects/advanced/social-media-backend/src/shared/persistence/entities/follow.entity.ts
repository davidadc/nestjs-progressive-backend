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

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class FollowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  followerId: string;

  @Column('uuid')
  @Index()
  followingId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.following, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'followerId' })
  follower: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.followers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'followingId' })
  following: UserEntity;
}
