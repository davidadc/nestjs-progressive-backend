import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PostEntity } from './post.entity';
import { CommentEntity } from './comment.entity';
import { LikeEntity } from './like.entity';
import { FollowEntity } from './follow.entity';
import { NotificationEntity } from './notification.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  followingCount: number;

  @Column({ default: 0 })
  postsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PostEntity, (post) => post.author)
  posts: PostEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.user)
  comments: CommentEntity[];

  @OneToMany(() => LikeEntity, (like) => like.user)
  likes: LikeEntity[];

  @OneToMany(() => FollowEntity, (follow) => follow.follower)
  following: FollowEntity[];

  @OneToMany(() => FollowEntity, (follow) => follow.following)
  followers: FollowEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.actor)
  actedNotifications: NotificationEntity[];
}
