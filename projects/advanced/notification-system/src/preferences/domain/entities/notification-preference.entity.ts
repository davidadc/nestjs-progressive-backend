import { Entity } from '../../../common/domain/entity';

export interface ChannelPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface PerTypePreferences {
  order_completed?: ChannelPreferences;
  new_comment?: ChannelPreferences;
  new_follower?: ChannelPreferences;
  liked_post?: ChannelPreferences;
  mention?: ChannelPreferences;
}

export interface CreatePreferenceProps {
  userId: string;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  perTypePrefs?: PerTypePreferences;
}

export interface ReconstitutedPreferenceProps {
  id: string;
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  perTypePrefs: PerTypePreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationPreference extends Entity<string> {
  private _userId: string;
  private _email: boolean;
  private _push: boolean;
  private _sms: boolean;
  private _perTypePrefs: PerTypePreferences;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string) {
    super(id);
  }

  /**
   * Create default preferences for a new user
   */
  public static createDefault(userId: string): NotificationPreference {
    const pref = new NotificationPreference(crypto.randomUUID());
    pref._userId = userId;
    pref._email = true;
    pref._push = true;
    pref._sms = false;
    pref._perTypePrefs = {};
    pref._createdAt = new Date();
    pref._updatedAt = new Date();
    return pref;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    props: ReconstitutedPreferenceProps,
  ): NotificationPreference {
    const pref = new NotificationPreference(props.id);
    pref._userId = props.userId;
    pref._email = props.email;
    pref._push = props.push;
    pref._sms = props.sms;
    pref._perTypePrefs = props.perTypePrefs || {};
    pref._createdAt = props.createdAt;
    pref._updatedAt = props.updatedAt;
    return pref;
  }

  /**
   * Update global channel preferences
   */
  public updateChannels(channels: Partial<ChannelPreferences>): void {
    if (channels.email !== undefined) {
      this._email = channels.email;
    }
    if (channels.push !== undefined) {
      this._push = channels.push;
    }
    if (channels.sms !== undefined) {
      this._sms = channels.sms;
    }
    this._updatedAt = new Date();
  }

  /**
   * Update preferences for a specific notification type
   */
  public updateTypePrefs(
    type: keyof PerTypePreferences,
    prefs: ChannelPreferences,
  ): void {
    this._perTypePrefs[type] = prefs;
    this._updatedAt = new Date();
  }

  /**
   * Check if a channel is enabled for a notification type
   */
  public isChannelEnabled(
    channel: 'email' | 'push' | 'sms',
    notificationType?: string,
  ): boolean {
    // Check global preference first
    if (!this[`_${channel}`]) {
      return false;
    }

    // Check type-specific preference
    if (notificationType) {
      const typePrefs =
        this._perTypePrefs[notificationType as keyof PerTypePreferences];
      if (typePrefs && typePrefs[channel] === false) {
        return false;
      }
    }

    return true;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get email(): boolean {
    return this._email;
  }

  get push(): boolean {
    return this._push;
  }

  get sms(): boolean {
    return this._sms;
  }

  get perTypePrefs(): PerTypePreferences {
    return { ...this._perTypePrefs };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
