import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IdempotencyKeyEntity } from './idempotency-key.entity';

export const IDEMPOTENCY_REPOSITORY = Symbol('IDEMPOTENCY_REPOSITORY');

export interface IIdempotencyRepository {
  findByKey(key: string): Promise<IdempotencyKeyEntity | null>;
  create(data: Partial<IdempotencyKeyEntity>): Promise<IdempotencyKeyEntity>;
  update(id: string, data: Partial<IdempotencyKeyEntity>): Promise<IdempotencyKeyEntity | null>;
  deleteExpired(): Promise<number>;
}

@Injectable()
export class IdempotencyRepository implements IIdempotencyRepository {
  constructor(
    @InjectRepository(IdempotencyKeyEntity)
    private readonly repository: Repository<IdempotencyKeyEntity>,
  ) {}

  async findByKey(key: string): Promise<IdempotencyKeyEntity | null> {
    return this.repository.findOne({ where: { key } });
  }

  async create(data: Partial<IdempotencyKeyEntity>): Promise<IdempotencyKeyEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: Partial<IdempotencyKeyEntity>,
  ): Promise<IdempotencyKeyEntity | null> {
    await this.repository.update(id, data);
    return this.repository.findOne({ where: { id } });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
