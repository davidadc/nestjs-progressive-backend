import { ICommand } from '@nestjs/cqrs';

export class UnfollowUserCommand implements ICommand {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
  ) {}
}
