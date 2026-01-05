import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from '../../application/services/user.service';
import { OnlineUserDto } from '../../application/dto/user-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('online')
  @ApiOperation({ summary: 'Get list of online users' })
  @ApiResponse({
    status: 200,
    description: 'List of online users',
    type: [OnlineUserDto],
  })
  async getOnlineUsers(@CurrentUser() user: { id: string }) {
    const onlineUsers = await this.userService.getOnlineUsers(user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: onlineUsers,
    };
  }
}
