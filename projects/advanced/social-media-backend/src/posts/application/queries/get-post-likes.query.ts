export class GetPostLikesQuery {
  constructor(
    public readonly postId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
