import type { User, UserData } from '../entities/user.entity';

export type CreateUserData = Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>;

export interface IUserRepository {
  create(user: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateStorageUsed(id: string, storageUsed: bigint): Promise<User>;
  incrementStorageUsed(id: string, increment: bigint): Promise<User>;
  decrementStorageUsed(id: string, decrement: bigint): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
