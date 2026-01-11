export class LikeCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly commentId: string,
  ) {}
}
