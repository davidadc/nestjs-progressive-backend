export class CreateCommentCommand {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly content: string,
  ) {}
}
