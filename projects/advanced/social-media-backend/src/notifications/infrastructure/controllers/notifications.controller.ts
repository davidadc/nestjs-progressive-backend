import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { NotificationQueryDto } from '../../application/dto/notification-query.dto';
import { NotificationListResponseDto } from '../../application/dto/notification-response.dto';
import { GetUserNotificationsQuery } from '../../application/queries/get-user-notifications.query';
import { MarkNotificationReadCommand } from '../../application/commands/mark-notification-read.command';
import { MarkAllNotificationsReadCommand } from '../../application/commands/mark-all-notifications-read.command';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Returns paginated list of notifications for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationListResponseDto,
  })
  async getNotifications(
    @Query() query: NotificationQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<NotificationListResponseDto> {
    return this.queryBus.execute(
      new GetUserNotificationsQuery(
        currentUser.userId,
        query.page,
        query.limit,
      ),
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a single notification as read',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification marked as read',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not allowed to mark this notification',
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new MarkNotificationReadCommand(id, currentUser.userId),
    );
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications for the current user as read',
  })
  @ApiResponse({
    status: 204,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new MarkAllNotificationsReadCommand(currentUser.userId),
    );
  }
}
