import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FindPostsDto } from './dto/find-posts.dto';
import {
  PostResponseDto,
  PostWithCommentsResponseDto,
  PaginatedPostsResponseDto,
} from './dto/post-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List published posts with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of published posts',
    type: PaginatedPostsResponseDto,
  })
  async findAll(
    @Query() dto: FindPostsDto,
  ): Promise<PaginatedPostsResponseDto> {
    return this.postsService.findAllPublished(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get post by slug with comments' })
  @ApiResponse({
    status: 200,
    description: 'Returns post with comments',
    type: PostWithCommentsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<PostWithCommentsResponseDto> {
    return this.postsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post (author only)' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - authors only' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.create(user.id, dto);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own post (author only)' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own posts',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async update(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.update(user.id, slug, dto);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete own post (author only)' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own posts',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async remove(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.postsService.remove(user.id, slug);
  }
}
