import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetPreferencesQuery } from '../queries/get-preferences.query';
import { UpdatePreferencesCommand } from '../commands/update-preferences.command';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { PreferenceResponseDto } from '../dto/preference-response.dto';
import type { PerTypePreferences } from '../../domain/entities/notification-preference.entity';

/**
 * Application service that orchestrates notification preference operations.
 * Acts as a facade over the CQRS commands and queries.
 */
@Injectable()
export class PreferenceService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<PreferenceResponseDto> {
    return this.queryBus.execute(new GetPreferencesQuery(userId));
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<PreferenceResponseDto> {
    return this.commandBus.execute(
      new UpdatePreferencesCommand(
        userId,
        dto.email,
        dto.push,
        dto.sms,
        dto.perType as PerTypePreferences | undefined,
      ),
    );
  }

  /**
   * Check if a channel is enabled for a user and notification type
   */
  async isChannelEnabled(
    userId: string,
    channel: 'email' | 'push' | 'sms',
    notificationType?: string,
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    // Check per-type preferences first
    if (notificationType && preferences.perType) {
      const typePrefs = preferences.perType[notificationType as keyof typeof preferences.perType];
      if (typePrefs && typeof typePrefs[channel] === 'boolean') {
        return typePrefs[channel];
      }
    }

    // Fall back to global preferences
    return preferences[channel] ?? false;
  }

  /**
   * Reset preferences to defaults for a user
   */
  async resetToDefaults(userId: string): Promise<PreferenceResponseDto> {
    return this.commandBus.execute(
      new UpdatePreferencesCommand(
        userId,
        true,  // email enabled by default
        true,  // push enabled by default
        false, // sms disabled by default
        {},    // no per-type overrides
      ),
    );
  }
}
