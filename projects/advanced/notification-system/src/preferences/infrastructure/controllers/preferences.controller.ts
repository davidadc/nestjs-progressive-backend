import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { GetPreferencesQuery } from '../../application/queries/get-preferences.query';
import { UpdatePreferencesCommand } from '../../application/commands/update-preferences.command';
import { UpdatePreferencesDto } from '../../application/dto/update-preferences.dto';
import { PreferenceResponseDto } from '../../application/dto/preference-response.dto';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@Controller('api/v1/notifications/preferences')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class PreferencesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns user preferences',
  })
  async getPreferences(
    @CurrentUser() user: JwtPayload,
  ): Promise<PreferenceResponseDto> {
    return this.queryBus.execute(new GetPreferencesQuery(user.sub));
  }

  @Patch()
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<PreferenceResponseDto> {
    return this.commandBus.execute(
      new UpdatePreferencesCommand(
        user.sub,
        dto.email,
        dto.push,
        dto.sms,
        dto.perType as any,
      ),
    );
  }
}
