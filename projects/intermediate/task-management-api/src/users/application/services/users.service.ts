import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly userMapper: UserMapper,
  ) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return this.userMapper.toResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updateData: Partial<User> = {};

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    return this.userMapper.toResponseDto(updatedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll();
    return this.userMapper.toResponseDtoList(users);
  }
}
