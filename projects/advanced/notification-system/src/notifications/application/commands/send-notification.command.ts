/**
 * Command to send/resend a notification through specified channels
 */
export class SendNotificationCommand {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly channels?: string[], // Optional: specific channels to use, otherwise uses preferences
  ) {}
}
