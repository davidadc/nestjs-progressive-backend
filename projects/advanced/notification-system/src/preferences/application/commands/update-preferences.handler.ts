import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdatePreferencesCommand } from './update-preferences.command';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import type { IPreferenceRepository } from '../../domain/repositories/preference.repository.interface';
import { PREFERENCE_REPOSITORY } from '../../domain/repositories/preference.repository.interface';
import { PreferenceMapper } from '../mappers/preference.mapper';
import { PreferenceResponseDto } from '../dto/preference-response.dto';

@CommandHandler(UpdatePreferencesCommand)
export class UpdatePreferencesHandler
  implements ICommandHandler<UpdatePreferencesCommand, PreferenceResponseDto>
{
  constructor(
    @Inject(PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: IPreferenceRepository,
  ) {}

  async execute(command: UpdatePreferencesCommand): Promise<PreferenceResponseDto> {
    // Find existing preferences or create default
    let preference = await this.preferenceRepository.findByUserId(command.userId);

    if (!preference) {
      preference = NotificationPreference.createDefault(command.userId);
    }

    // Update channel preferences
    preference.updateChannels({
      email: command.email,
      push: command.push,
      sms: command.sms,
    });

    // Update per-type preferences if provided
    if (command.perTypePrefs) {
      for (const [type, prefs] of Object.entries(command.perTypePrefs)) {
        if (prefs) {
          preference.updateTypePrefs(type as any, prefs);
        }
      }
    }

    // Save changes
    await this.preferenceRepository.save(preference);

    return PreferenceMapper.toDto(preference);
  }
}
