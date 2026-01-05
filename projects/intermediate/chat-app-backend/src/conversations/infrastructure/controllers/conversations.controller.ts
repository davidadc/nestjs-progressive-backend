import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConversationService } from '../../application/services/conversation.service';
import { MessageService } from '../../../messages/application/services/message.service';
import {
  CreateConversationDto,
  AddParticipantDto,
  ConversationResponseDto,
} from '../../application/dto';
import {
  SendMessageDto,
  MessageResponseDto,
} from '../../../messages/application/dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../../common/dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('api/v1/conversations')
export class ConversationsController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List user conversations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of conversations',
    type: [ConversationResponseDto],
  })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() pagination: PaginationQueryDto,
  ) {
    const { conversations, pagination: paginationMeta } =
      await this.conversationService.findByUserId(
        user.id,
        pagination.page || 1,
        pagination.limit || 20,
      );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: conversations,
      pagination: paginationMeta,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created',
    type: ConversationResponseDto,
  })
  async create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: { id: string },
  ) {
    const conversation = await this.conversationService.create(dto, user.id);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: conversation,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Conversation details',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const conversation = await this.conversationService.findById(id, user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: conversation,
    };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get message history' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Message history',
    type: [MessageResponseDto],
  })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Query() pagination: PaginationQueryDto,
  ) {
    const { messages, pagination: paginationMeta } =
      await this.messageService.getMessageHistory(
        id,
        user.id,
        pagination.page || 1,
        pagination.limit || 50,
      );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: messages,
      pagination: paginationMeta,
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message (prefer WebSocket)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 201,
    description: 'Message sent',
    type: MessageResponseDto,
  })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    const message = await this.messageService.sendMessage(id, dto, user.id);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: message,
    };
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participant to conversation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 201,
    description: 'Participant added',
    type: ConversationResponseDto,
  })
  async addParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddParticipantDto,
    @CurrentUser() user: { id: string },
  ) {
    const conversation = await this.conversationService.addParticipant(
      id,
      dto.userId,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: conversation,
    };
  }
}
