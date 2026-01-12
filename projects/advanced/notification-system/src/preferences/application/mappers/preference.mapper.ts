import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import { PreferenceResponseDto } from '../dto/preference-response.dto';
import { NotificationPreferenceRow } from '../../../drizzle/schema';

export class PreferenceMapper {
  /**
   * Map domain entity to response DTO
   */
  public static toDto(entity: NotificationPreference): PreferenceResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      email: entity.email,
      push: entity.push,
      sms: entity.sms,
      perType: entity.perTypePrefs,
    };
  }

  /**
   * Map database row to domain entity
   */
  public static toDomain(row: NotificationPreferenceRow): NotificationPreference {
    return NotificationPreference.reconstitute({
      id: row.id,
      userId: row.userId,
      email: row.email,
      push: row.push,
      sms: row.sms,
      perTypePrefs: (row.perTypePrefs as any) || {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Map domain entity to database insert object
   */
  public static toPersistence(entity: NotificationPreference): {
    id: string;
    userId: string;
    email: boolean;
    push: boolean;
    sms: boolean;
    perTypePrefs: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: entity.id,
      userId: entity.userId,
      email: entity.email,
      push: entity.push,
      sms: entity.sms,
      perTypePrefs: entity.perTypePrefs,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
