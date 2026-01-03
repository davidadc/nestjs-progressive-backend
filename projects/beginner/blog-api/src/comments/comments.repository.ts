import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  async create(data: Partial<Comment>): Promise<Comment> {
    const comment = this.repository.create(data);
    return this.repository.save(comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
