import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../../infrastructure/persistence/user.orm-entity';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
  toDomain(ormEntity: UserOrmEntity): User {
    return new User(
      ormEntity.id,
      ormEntity.email,
      ormEntity.password,
      ormEntity.name,
      ormEntity.role,
      ormEntity.addresses || [],
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  toOrmEntity(domain: User): Partial<UserOrmEntity> {
    return {
      id: domain.id,
      email: domain.email,
      password: domain.password,
      name: domain.name,
      role: domain.role,
      addresses: domain.addresses,
    };
  }

  toResponseDto(domain: User): UserResponseDto {
    return {
      id: domain.id,
      email: domain.email,
      name: domain.name,
      role: domain.role,
      addresses: domain.addresses,
      createdAt: domain.createdAt,
    };
  }
}
