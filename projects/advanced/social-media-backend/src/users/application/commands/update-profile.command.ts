import { ICommand } from '@nestjs/cqrs';

export class UpdateProfileCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly bio?: string,
    public readonly avatar?: string,
  ) {}
}
