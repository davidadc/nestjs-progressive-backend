import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { PostEntity } from './post.entity';

@Entity('hashtags')
export class HashtagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  tag: string;

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToMany(() => PostEntity, (post) => post.hashtags)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'postId', referencedColumnName: 'id' },
  })
  posts: PostEntity[];
}
