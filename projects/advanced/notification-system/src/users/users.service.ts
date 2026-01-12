import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { users, User, NewUser } from '../drizzle/schema';

type DrizzleDb = ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: Pick<NewUser, 'email' | 'password'>): Promise<User> {
    const result = await this.db
      .insert(users)
      .values({
        email: data.email,
        password: data.password,
      })
      .returning();

    return result[0];
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  }
}
