import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import { UserPersistenceMapper } from './user.persistence-mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
    private readonly mapper: UserPersistenceMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.mapper.toOrm(user);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    const entity = this.mapper.toOrm(user);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }
}
