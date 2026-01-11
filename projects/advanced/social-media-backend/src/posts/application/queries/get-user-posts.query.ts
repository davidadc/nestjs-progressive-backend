export class GetUserPostsQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly currentUserId?: string,
  ) {}
}
