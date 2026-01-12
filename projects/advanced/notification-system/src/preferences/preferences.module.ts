import { Module, Global } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { PreferencesController } from './infrastructure/controllers/preferences.controller';

// Repository
import { PREFERENCE_REPOSITORY } from './domain/repositories/preference.repository.interface';
import { PreferenceRepository } from './infrastructure/persistence/preference.repository';

// Command Handlers
import { UpdatePreferencesHandler } from './application/commands/update-preferences.handler';

// Query Handlers
import { GetPreferencesHandler } from './application/queries/get-preferences.handler';

// Services
import { PreferenceService } from './application/services/preference.service';

const CommandHandlers = [UpdatePreferencesHandler];

const QueryHandlers = [GetPreferencesHandler];

@Global()
@Module({
  imports: [CqrsModule],
  controllers: [PreferencesController],
  providers: [
    // Repository
    {
      provide: PREFERENCE_REPOSITORY,
      useClass: PreferenceRepository,
    },
    // Services
    PreferenceService,
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PREFERENCE_REPOSITORY, PreferenceService],
})
export class PreferencesModule {}
