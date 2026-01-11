import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CommentResponseDto } from '../../application/dto/comment-response.dto';
import { CreateCommentDto } from '../../application/dto/create-comment.dto';
import { CreateCommentCommand } from '../../application/commands/create-comment.command';
import { DeleteCommentCommand } from '../../application/commands/delete-comment.command';
import { LikeCommentCommand } from '../../application/commands/like-comment.command';
import { UnlikeCommentCommand } from '../../application/commands/unlike-comment.command';
import { GetPostCommentsQuery } from '../../application/queries/get-post-comments.query';
import { PaginatedResult } from '../../../common/interceptors/response-envelope.interceptor';

@ApiTags('Comments')
@Controller('api/v1/posts/:postId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async createComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<CommentResponseDto> {
    return this.commandBus.execute(
      new CreateCommentCommand(postId, currentUser.userId, dto.content),
    );
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'List of comments',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPostComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<CommentResponseDto>> {
    return this.queryBus.execute(
      new GetPostCommentsQuery(postId, pagination.page, pagination.limit),
    );
  }

  @Delete(':commentId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 204,
    description: 'Comment deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own comments',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async deleteComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteCommentCommand(commentId, currentUser.userId),
    );
  }

  @Post(':commentId/like')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 204,
    description: 'Comment liked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Already liked this comment',
  })
  async likeComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new LikeCommentCommand(currentUser.userId, commentId),
    );
  }

  @Delete(':commentId/like')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({
    status: 204,
    description: 'Comment unliked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Not liked this comment',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found',
  })
  async unlikeComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new UnlikeCommentCommand(currentUser.userId, commentId),
    );
  }
}
