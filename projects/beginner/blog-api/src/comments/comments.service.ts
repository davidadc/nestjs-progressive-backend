import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { PostsService } from '../posts/posts.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsService: PostsService,
  ) {}

  async create(
    userId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // Verify post exists
    const post = await this.postsService.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    const comment = await this.commentsRepository.create({
      content: dto.content,
      userId,
      postId,
    });

    // Fetch with user relation
    const commentWithUser = await this.commentsRepository.findById(comment.id);
    return new CommentResponseDto(commentWithUser!);
  }

  async findByPostId(postId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentsRepository.findByPostId(postId);
    return comments.map((comment) => new CommentResponseDto(comment));
  }

  async remove(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException(`Comment with ID '${commentId}' not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.delete(commentId);
  }
}
