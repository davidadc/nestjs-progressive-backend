import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../drizzle/drizzle.module';
import { notificationPreferences } from '../../../drizzle/schema';
import {
  IPreferenceRepository,
} from '../../domain/repositories/preference.repository.interface';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { PreferenceMapper } from '../../application/mappers/preference.mapper';

type DrizzleDb = ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>;

@Injectable()
export class PreferenceRepository implements IPreferenceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async save(preference: NotificationPreference): Promise<void> {
    const data = PreferenceMapper.toPersistence(preference);

    await this.db
      .insert(notificationPreferences)
      .values(data)
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          email: data.email,
          push: data.push,
          sms: data.sms,
          perTypePrefs: data.perTypePrefs,
          updatedAt: data.updatedAt,
        },
      });
  }

  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const results = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return PreferenceMapper.toDomain(results[0]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db
      .delete(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }
}
