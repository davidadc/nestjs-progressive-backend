import { Injectable, Inject } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.module';
import type { DrizzleDB } from '../../../database/drizzle.module';
import { users } from '../../../database/schema';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] ? new UserEntity(result[0]) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ? new UserEntity(result[0]) : null;
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];

    const result = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, ids));

    return result.map((user) => new UserEntity(user));
  }

  async findOnlineUsers(userIds: string[]): Promise<UserEntity[]> {
    return this.findByIds(userIds);
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const result = await this.db
      .insert(users)
      .values({
        email: user.email!,
        name: user.name!,
        password: user.password!,
        avatar: user.avatar,
      })
      .returning();

    return new UserEntity(result[0]);
  }

  async update(
    id: string,
    data: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const result = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0] ? new UserEntity(result[0]) : null;
  }
}
