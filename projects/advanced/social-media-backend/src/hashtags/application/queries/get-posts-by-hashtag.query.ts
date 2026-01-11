export class GetPostsByHashtagQuery {
  constructor(
    public readonly tag: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly currentUserId?: string,
  ) {}
}
