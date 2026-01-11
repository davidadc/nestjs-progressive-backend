export class UnlikeCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly commentId: string,
  ) {}
}
