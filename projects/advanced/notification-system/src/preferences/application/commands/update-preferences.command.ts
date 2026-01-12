import { PerTypePreferences } from '../../domain/entities/notification-preference.entity';

export class UpdatePreferencesCommand {
  constructor(
    public readonly userId: string,
    public readonly email?: boolean,
    public readonly push?: boolean,
    public readonly sms?: boolean,
    public readonly perTypePrefs?: PerTypePreferences,
  ) {}
}
