import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WsAuthGuard } from '../../../auth/infrastructure/guards/ws-auth.guard';
import { PresenceService } from '../../application/services/presence.service';
import { MessageService } from '../../../messages/application/services/message.service';
import { ConversationService } from '../../../conversations/application/services/conversation.service';
import { AuthService } from '../../../auth/application/services/auth.service';
import {
  WsSendMessageDto,
  WsJoinConversationDto,
  WsLeaveConversationDto,
} from '../../application/dto/ws-message.dto';
import {
  TypingIndicatorDto,
  PresenceUpdateDto,
} from '../../application/dto/typing-indicator.dto';
import { JwtPayload, AuthenticatedSocketData } from '../../../common/types';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly presenceService: PresenceService,
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('error', {
          message: 'No token provided',
          code: 'AUTH_ERROR',
        });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        client.emit('error', { message: 'User not found', code: 'AUTH_ERROR' });
        client.disconnect();
        return;
      }

      (client.data as AuthenticatedSocketData).user = user;
      await this.presenceService.setUserOnline(user.id, 'online');

      // Broadcast user online event
      this.server.emit('user:online', {
        userId: user.id,
        name: user.name,
        status: 'online',
      });

      console.log(`User ${user.name} (${user.id}) connected`);
    } catch {
      client.emit('error', { message: 'Invalid token', code: 'AUTH_ERROR' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = this.getUser(client);
    if (user) {
      await this.presenceService.setUserOffline(user.id);
      this.server.emit('user:offline', { userId: user.id });
      console.log(`User ${user.name} (${user.id}) disconnected`);
    }
  }

  private getUser(client: Socket) {
    return (client.data as Partial<AuthenticatedSocketData>).user;
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: WsJoinConversationDto,
  ) {
    const user = this.getUser(client)!;
    const isParticipant = await this.conversationService.isParticipant(
      data.conversationId,
      user.id,
    );

    if (!isParticipant) {
      client.emit('error', {
        message: 'Not a participant of this conversation',
        code: 'FORBIDDEN',
      });
      return;
    }

    await client.join(`conversation:${data.conversationId}`);
    console.log(`User ${user.id} joined conversation ${data.conversationId}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: WsLeaveConversationDto,
  ) {
    const user = this.getUser(client)!;
    void client.leave(`conversation:${data.conversationId}`);
    await this.presenceService.clearTyping(data.conversationId, user.id);
    console.log(`User ${user.id} left conversation ${data.conversationId}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: WsSendMessageDto,
  ) {
    const user = this.getUser(client)!;

    try {
      const message = await this.messageService.sendMessage(
        data.conversationId,
        { content: data.content },
        user.id,
      );

      // Clear typing indicator
      await this.presenceService.clearTyping(data.conversationId, user.id);

      // Broadcast to all participants in the conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:received', message);

      // Also notify participants who might not have joined the room
      const participantIds = await this.conversationService.getParticipantIds(
        data.conversationId,
      );
      for (const participantId of participantIds) {
        if (participantId !== user.id) {
          // Find their socket and emit if not in room
          const sockets = await this.server.fetchSockets();
          for (const socket of sockets) {
            const socketUser = (socket.data as Partial<AuthenticatedSocketData>)
              .user;
            if (
              socketUser?.id === participantId &&
              !socket.rooms.has(`conversation:${data.conversationId}`)
            ) {
              socket.emit('message:received', message);
            }
          }
        }
      }
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to send message',
        code: 'MESSAGE_ERROR',
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    const user = this.getUser(client)!;
    await this.presenceService.setTyping(data.conversationId, user.id);

    client.to(`conversation:${data.conversationId}`).emit('typing:update', {
      conversationId: data.conversationId,
      userId: user.id,
      isTyping: true,
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    const user = this.getUser(client)!;
    await this.presenceService.clearTyping(data.conversationId, user.id);

    client.to(`conversation:${data.conversationId}`).emit('typing:update', {
      conversationId: data.conversationId,
      userId: user.id,
      isTyping: false,
    });
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PresenceUpdateDto,
  ) {
    const user = this.getUser(client)!;
    await this.presenceService.updateStatus(user.id, data.status);

    this.server.emit('user:online', {
      userId: user.id,
      name: user.name,
      status: data.status,
    });
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) return auth.token;

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
