import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository, CreateUserData } from './users.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: CreateUserData): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.findById(id); // Ensures user exists
    return this.usersRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Ensures user exists
    return this.usersRepository.delete(id);
  }
}
