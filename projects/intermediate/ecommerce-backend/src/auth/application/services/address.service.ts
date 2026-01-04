import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { Address } from '../../domain/entities/user.entity';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponseDto,
} from '../dto/address.dto';

@Injectable()
export class AddressService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async listAddresses(userId: string): Promise<AddressResponseDto[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.addresses.map((addr) => this.toResponseDto(addr));
  }

  async addAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const address: Address = {
      id: uuidv4(),
      street: dto.street,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      country: dto.country,
      isDefault: dto.isDefault ?? false,
    };

    user.addAddress(address);
    await this.userRepository.update(user);

    // Return the address (might have been modified if it became default)
    const savedAddress = user.getAddressById(address.id);
    return this.toResponseDto(savedAddress!);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const address = user.getAddressById(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const updatedAddress = user.updateAddress(addressId, dto);
    if (!updatedAddress) {
      throw new BadRequestException('Failed to update address');
    }

    await this.userRepository.update(user);

    return this.toResponseDto(updatedAddress);
  }

  async removeAddress(userId: string, addressId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const removed = user.removeAddress(addressId);
    if (!removed) {
      throw new NotFoundException('Address not found');
    }

    await this.userRepository.update(user);
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const address = user.setDefaultAddress(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.userRepository.update(user);

    return this.toResponseDto(address);
  }

  async getAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const address = user.getAddressById(addressId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.toResponseDto(address);
  }

  private toResponseDto(address: Address): AddressResponseDto {
    return {
      id: address.id,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    };
  }
}
