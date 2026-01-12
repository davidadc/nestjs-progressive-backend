import { NotificationPreference } from '../entities/notification-preference.entity';

export const PREFERENCE_REPOSITORY = Symbol('PREFERENCE_REPOSITORY');

export interface IPreferenceRepository {
  /**
   * Save a preference (insert or update)
   */
  save(preference: NotificationPreference): Promise<void>;

  /**
   * Find preference by user ID
   */
  findByUserId(userId: string): Promise<NotificationPreference | null>;

  /**
   * Delete preference by user ID
   */
  deleteByUserId(userId: string): Promise<void>;
}
