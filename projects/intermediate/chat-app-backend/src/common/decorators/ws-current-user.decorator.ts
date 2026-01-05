import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UserResponseDto } from '../../auth/application/dto';
import { AuthenticatedSocketData } from '../types';

export const WsCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserResponseDto | undefined => {
    const client = ctx.switchToWs().getClient<Socket>();
    return (client.data as Partial<AuthenticatedSocketData>).user;
  },
);
