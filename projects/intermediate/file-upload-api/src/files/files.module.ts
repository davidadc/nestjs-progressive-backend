import { Module } from '@nestjs/common';
import { FilesController } from './infrastructure/controllers/files.controller';
import { FileService } from './application/services/file.service';
import { ThumbnailService } from './application/services/thumbnail.service';
import { FileMapper } from './application/mappers/file.mapper';
import { FileRepository } from './infrastructure/persistence/file.repository';
import { LocalStorageStrategy } from './infrastructure/storage/local.storage.strategy';
import { S3StorageStrategy } from './infrastructure/storage/s3.storage.strategy';
import { StorageFactory } from './infrastructure/storage/storage.factory';
import { FILE_REPOSITORY } from './domain/repositories/file.repository.interface';
import { STORAGE_STRATEGY } from './domain/strategies/storage.strategy.interface';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [FilesController],
  providers: [
    FileService,
    ThumbnailService,
    FileMapper,
    LocalStorageStrategy,
    S3StorageStrategy,
    StorageFactory,
    {
      provide: FILE_REPOSITORY,
      useClass: FileRepository,
    },
    {
      provide: STORAGE_STRATEGY,
      useFactory: (factory: StorageFactory) => factory.getStrategy(),
      inject: [StorageFactory],
    },
  ],
  exports: [FileService],
})
export class FilesModule {}
