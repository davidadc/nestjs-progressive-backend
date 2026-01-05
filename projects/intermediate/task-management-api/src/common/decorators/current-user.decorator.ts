import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/domain/entities/user.entity';

interface AuthenticatedRequest {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof User | undefined,
    ctx: ExecutionContext,
  ): User | User[keyof User] | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
