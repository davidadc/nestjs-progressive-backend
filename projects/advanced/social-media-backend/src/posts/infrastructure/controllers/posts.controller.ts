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
import {
  LikeUserDto,
  PostResponseDto,
} from '../../application/dto/post-response.dto';
import { CreatePostDto } from '../../application/dto/create-post.dto';
import { CreatePostCommand } from '../../application/commands/create-post.command';
import { DeletePostCommand } from '../../application/commands/delete-post.command';
import { LikePostCommand } from '../../application/commands/like-post.command';
import { UnlikePostCommand } from '../../application/commands/unlike-post.command';
import { GetPostQuery } from '../../application/queries/get-post.query';
import { GetUserPostsQuery } from '../../application/queries/get-user-posts.query';
import { GetPostLikesQuery } from '../../application/queries/get-post-likes.query';
import { PaginatedResult } from '../../../common/interceptors/response-envelope.interceptor';

@ApiTags('Posts')
@Controller('api/v1/posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  async createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<PostResponseDto> {
    return this.commandBus.execute(
      new CreatePostCommand(currentUser.userId, dto.content, dto.images),
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post details',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ): Promise<PostResponseDto> {
    return this.queryBus.execute(new GetPostQuery(id, currentUser?.userId));
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 204,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeletePostCommand(id, currentUser.userId),
    );
  }

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Get posts by user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of user posts',
  })
  async getUserPosts(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ): Promise<PaginatedResult<PostResponseDto>> {
    return this.queryBus.execute(
      new GetUserPostsQuery(
        userId,
        pagination.page,
        pagination.limit,
        currentUser?.userId,
      ),
    );
  }

  @Post(':id/like')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 204,
    description: 'Post liked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Already liked this post',
  })
  async likePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new LikePostCommand(currentUser.userId, id),
    );
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 204,
    description: 'Post unliked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Not liked this post',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async unlikePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new UnlikePostCommand(currentUser.userId, id),
    );
  }

  @Get(':id/likes')
  @Public()
  @ApiOperation({ summary: 'Get users who liked a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'List of users who liked the post',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPostLikes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<LikeUserDto>> {
    return this.queryBus.execute(
      new GetPostLikesQuery(id, pagination.page, pagination.limit),
    );
  }
}
