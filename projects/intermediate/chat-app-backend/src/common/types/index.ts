import { UserResponseDto } from '../../auth/application/dto';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedSocketData {
  user: UserResponseDto;
}
