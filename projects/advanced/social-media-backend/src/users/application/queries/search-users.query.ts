import { IQuery } from '@nestjs/cqrs';

export class SearchUsersQuery implements IQuery {
  constructor(
    public readonly query: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
