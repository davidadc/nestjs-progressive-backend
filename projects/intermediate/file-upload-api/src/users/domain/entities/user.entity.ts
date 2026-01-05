export interface UserData {
  id: string;
  email: string;
  password: string;
  storageUsed: bigint;
  storageLimit: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export class User implements UserData {
  id: string;
  email: string;
  password: string;
  storageUsed: bigint;
  storageLimit: bigint;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: UserData) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.storageUsed = data.storageUsed;
    this.storageLimit = data.storageLimit;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  hasAvailableStorage(fileSize: bigint): boolean {
    return this.storageUsed + fileSize <= this.storageLimit;
  }

  getAvailableStorage(): bigint {
    return this.storageLimit - this.storageUsed;
  }

  getStorageUsagePercentage(): number {
    if (this.storageLimit === BigInt(0)) return 0;
    return Number((this.storageUsed * BigInt(100)) / this.storageLimit);
  }
}
