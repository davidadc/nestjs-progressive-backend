import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  toResponseDtoList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponseDto(user));
  }
}
