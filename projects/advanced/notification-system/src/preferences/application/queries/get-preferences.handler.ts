import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPreferencesQuery } from './get-preferences.query';
import { NotificationPreference } from '../../domain/entities/notification-preference.entity';
import type { IPreferenceRepository } from '../../domain/repositories/preference.repository.interface';
import { PREFERENCE_REPOSITORY } from '../../domain/repositories/preference.repository.interface';
import { PreferenceMapper } from '../mappers/preference.mapper';
import { PreferenceResponseDto } from '../dto/preference-response.dto';

@QueryHandler(GetPreferencesQuery)
export class GetPreferencesHandler
  implements IQueryHandler<GetPreferencesQuery, PreferenceResponseDto>
{
  constructor(
    @Inject(PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: IPreferenceRepository,
  ) {}

  async execute(query: GetPreferencesQuery): Promise<PreferenceResponseDto> {
    let preference = await this.preferenceRepository.findByUserId(query.userId);

    // Create default preferences if none exist
    if (!preference) {
      preference = NotificationPreference.createDefault(query.userId);
      await this.preferenceRepository.save(preference);
    }

    return PreferenceMapper.toDto(preference);
  }
}
