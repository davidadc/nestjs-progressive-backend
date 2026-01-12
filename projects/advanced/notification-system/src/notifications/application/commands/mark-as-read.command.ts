export class MarkAsReadCommand {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {}
}
