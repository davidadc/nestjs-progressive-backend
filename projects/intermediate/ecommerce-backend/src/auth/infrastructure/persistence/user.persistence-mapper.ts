import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import type { Address } from '../../domain/value-objects/address.value-object';

@Injectable()
export class UserPersistenceMapper {
  toDomain(entity: UserOrmEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.password,
      entity.name,
      entity.role,
      entity.addresses as Address[],
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toOrm(domain: User): UserOrmEntity {
    const entity = new UserOrmEntity();
    entity.id = domain.id;
    entity.email = domain.email;
    entity.password = domain.password;
    entity.name = domain.name;
    entity.role = domain.role;
    entity.addresses = domain.addresses;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
