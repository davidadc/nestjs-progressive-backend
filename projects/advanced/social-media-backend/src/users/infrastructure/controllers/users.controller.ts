import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  UserResponseDto,
  UserSummaryDto,
} from '../../application/dto/user-response.dto';
import { UpdateProfileDto } from '../../application/dto/update-profile.dto';
import { GetUserProfileQuery } from '../../application/queries/get-user-profile.query';
import { GetFollowersQuery } from '../../application/queries/get-followers.query';
import { GetFollowingQuery } from '../../application/queries/get-following.query';
import { SearchUsersQuery } from '../../application/queries/search-users.query';
import { FollowUserCommand } from '../../application/commands/follow-user.command';
import { UnfollowUserCommand } from '../../application/commands/unfollow-user.command';
import { UpdateProfileCommand } from '../../application/commands/update-profile.command';
import { PaginatedResult } from '../../../common/interceptors/response-envelope.interceptor';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';

@ApiTags('Users')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search users by username or name' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({
    status: 200,
    description: 'Users matching the search query',
  })
  async searchUsers(
    @Query('q') query: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<UserSummaryDto>> {
    return this.queryBus.execute(
      new SearchUsersQuery(query, pagination.page, pagination.limit),
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    return this.queryBus.execute(
      new GetUserProfileQuery(id, currentUser?.userId),
    );
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    // Only allow updating own profile
    if (id !== currentUser.userId) {
      throw ProblemDetailsFactory.forbidden(
        'You can only update your own profile',
      );
    }

    return this.commandBus.execute(
      new UpdateProfileCommand(id, dto.name, dto.bio, dto.avatar),
    );
  }

  @Get(':id/followers')
  @Public()
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getFollowers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<UserSummaryDto>> {
    return this.queryBus.execute(
      new GetFollowersQuery(id, pagination.page, pagination.limit),
    );
  }

  @Get(':id/following')
  @Public()
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of following',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<UserSummaryDto>> {
    return this.queryBus.execute(
      new GetFollowingQuery(id, pagination.page, pagination.limit),
    );
  }

  @Post(':id/follow')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', description: 'User ID to follow' })
  @ApiResponse({
    status: 204,
    description: 'Successfully followed user',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot follow yourself',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Already following this user',
  })
  async followUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new FollowUserCommand(currentUser.userId, id),
    );
  }

  @Delete(':id/follow')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'id', description: 'User ID to unfollow' })
  @ApiResponse({
    status: 204,
    description: 'Successfully unfollowed user',
  })
  @ApiResponse({
    status: 400,
    description: 'Not following this user',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async unfollowUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new UnfollowUserCommand(currentUser.userId, id),
    );
  }
}
