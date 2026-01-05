import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../../application/services/auth.service';
import { JwtPayload, AuthenticatedSocketData } from '../../../common/types';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        throw new WsException('Unauthorized: User not found');
      }

      // Attach user to socket data
      (client.data as AuthenticatedSocketData).user = user;
      return true;
    } catch {
      throw new WsException('Unauthorized: Invalid token');
    }
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
