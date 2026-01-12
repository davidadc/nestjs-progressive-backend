import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { WebSocketChannel } from '../../../channels/infrastructure/websocket/websocket.channel';
import { MarkAsReadCommand } from '../../application/commands/mark-as-read.command';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      sub: string;
      email: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly jwtService: JwtService,
    private readonly webSocketChannel: WebSocketChannel,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    // Inject server reference into WebSocket channel for broadcasting
    this.webSocketChannel.setServer(server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);

    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`No token provided, disconnecting: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      // Join user-specific room
      const userId = payload.sub;
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
      client.emit('connected', { message: 'Successfully connected' });
    } catch (error) {
      this.logger.error(`Authentication failed: ${client.id}`, error);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.sub;
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId || 'unknown'})`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { token?: string },
  ): { success: boolean; message: string } {
    const user = client.data.user;
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    this.logger.log(`User ${user.sub} subscribed to notifications`);
    return { success: true, message: 'Subscribed to notifications' };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ): Promise<{ success: boolean; message?: string }> {
    const user = client.data.user;
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const result = await this.commandBus.execute(
        new MarkAsReadCommand(data.notificationId, user.sub),
      );

      // Broadcast read event to all user's connections
      this.server.to(`user:${user.sub}`).emit('notification_read', {
        id: data.notificationId,
        readAt: result.readAt,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to mark notification as read`, error);
      return { success: false, message: 'Failed to mark as read' };
    }
  }

  /**
   * Send unread count update to a specific user
   */
  sendUnreadCount(userId: string, count: number): void {
    this.server.to(`user:${userId}`).emit('unread_count', { count });
  }

  private extractToken(client: Socket): string | null {
    // Try handshake auth
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Try query params
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // Try authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') {
        return token;
      }
    }

    return null;
  }
}
