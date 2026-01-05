import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageStrategy } from '../../domain/strategies/storage.strategy.interface';
import { LocalStorageStrategy } from './local.storage.strategy';
import { S3StorageStrategy } from './s3.storage.strategy';
import type { StorageConfig } from '../../../config';

@Injectable()
export class StorageFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageStrategy: LocalStorageStrategy,
    private readonly s3StorageStrategy: S3StorageStrategy,
  ) {}

  getStrategy(): IStorageStrategy {
    const storageConfig = this.configService.get<StorageConfig>('storage')!;

    switch (storageConfig.type) {
      case 's3':
        return this.s3StorageStrategy;
      case 'local':
      default:
        return this.localStorageStrategy;
    }
  }
}
