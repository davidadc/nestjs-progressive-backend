export class GetTrendingFeedQuery {
  constructor(
    public readonly cursor?: string,
    public readonly limit: number = 20,
    public readonly currentUserId?: string,
  ) {}
}
