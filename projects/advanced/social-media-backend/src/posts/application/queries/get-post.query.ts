export class GetPostQuery {
  constructor(
    public readonly postId: string,
    public readonly currentUserId?: string,
  ) {}
}
