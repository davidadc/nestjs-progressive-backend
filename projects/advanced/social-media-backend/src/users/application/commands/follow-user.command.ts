import { ICommand } from '@nestjs/cqrs';

export class FollowUserCommand implements ICommand {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
  ) {}
}
