import { TaskComment } from '../entities/comment.entity';

export interface CreateCommentData {
  taskId: string;
  userId: string;
  content: string;
}

export interface ICommentRepository {
  create(data: CreateCommentData): Promise<TaskComment>;
  findById(id: string): Promise<TaskComment | null>;
  findByTaskId(taskId: string): Promise<TaskComment[]>;
  findByUserId(userId: string): Promise<TaskComment[]>;
  update(id: string, content: string): Promise<TaskComment>;
  delete(id: string): Promise<void>;
  countByTaskId(taskId: string): Promise<number>;
}

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');
