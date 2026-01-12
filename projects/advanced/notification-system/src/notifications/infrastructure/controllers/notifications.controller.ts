import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { GetNotificationsQuery } from '../../application/queries/get-notifications.query';
import { GetUnreadCountQuery } from '../../application/queries/get-unread-count.query';
import { MarkAsReadCommand } from '../../application/commands/mark-as-read.command';
import { MarkAllAsReadCommand } from '../../application/commands/mark-all-as-read.command';
import { NotificationFilterDto } from '../../application/dto/notification-filter.dto';
import { NotificationResponseDto } from '../../application/dto/notification-response.dto';
import { PaginationDto } from '../../application/dto/pagination.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class NotificationsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notification history with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated notifications',
  })
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() filter: NotificationFilterDto,
  ): Promise<{ data: NotificationResponseDto[]; pagination: PaginationDto }> {
    return this.queryBus.execute(
      new GetNotificationsQuery(
        user.sub,
        filter.page,
        filter.limit,
        filter.read,
        filter.type,
      ),
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of unread notifications',
  })
  async getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ count: number }> {
    return this.queryBus.execute(new GetUnreadCountQuery(user.sub));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.commandBus.execute(new MarkAsReadCommand(id, user.sub));
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ markedCount: number }> {
    return this.commandBus.execute(new MarkAllAsReadCommand(user.sub));
  }
}
