import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { FileEntity } from '../../domain/entities/file.entity';
import {
  FILE_REPOSITORY,
  type IFileRepository,
  type FindFilesOptions,
} from '../../domain/repositories/file.repository.interface';
import {
  STORAGE_STRATEGY,
  type IStorageStrategy,
  type StorageFile,
} from '../../domain/strategies/storage.strategy.interface';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/repositories/user.repository.interface';
import {
  FileNotFoundException,
  FileAccessDeniedException,
  StorageQuotaExceededException,
  InvalidFileTypeException,
  FileTooLargeException,
  ThumbnailNotAvailableException,
} from '../../domain/exceptions/file.exceptions';
import { ThumbnailService } from './thumbnail.service';
import type { Readable } from 'stream';
import type { UploadConfig, StorageConfig } from '../../../config';

@Injectable()
export class FileService {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly storageType: string;

  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: IFileRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STORAGE_STRATEGY)
    private readonly storageStrategy: IStorageStrategy,
    private readonly thumbnailService: ThumbnailService,
    private readonly configService: ConfigService,
  ) {
    const uploadConfig = this.configService.get<UploadConfig>('upload')!;
    const storageConfig = this.configService.get<StorageConfig>('storage')!;

    this.maxFileSize = uploadConfig.maxFileSize;
    this.allowedMimeTypes = uploadConfig.allowedMimeTypes;
    this.storageType = storageConfig.type;
  }

  async uploadFile(file: StorageFile, userId: string): Promise<FileEntity> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new FileTooLargeException(file.size, this.maxFileSize);
    }

    // Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(file.mimetype, this.allowedMimeTypes);
    }

    // Check storage quota
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.hasAvailableStorage(BigInt(file.size))) {
      throw new StorageQuotaExceededException(
        BigInt(file.size),
        user.getAvailableStorage(),
      );
    }

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension ? '.' + fileExtension : ''}`;

    // Use configured storage type
    const storageType = this.storageType;

    // Save file to storage
    const storagePath = await this.storageStrategy.save(file, uniqueFilename);

    // Check if image and generate thumbnail
    const isImage = this.thumbnailService.isImageMimeType(file.mimetype);
    let thumbnailPath: string | null = null;

    if (isImage) {
      try {
        const thumbnailBuffer = await this.thumbnailService.generate(
          file.buffer,
        );
        const thumbnailFilename = `thumb_${uniqueFilename.replace(/\.[^.]+$/, '')}.webp`;
        thumbnailPath = await this.storageStrategy.save(
          {
            buffer: thumbnailBuffer,
            originalname: thumbnailFilename,
            mimetype: 'image/webp',
            size: thumbnailBuffer.length,
          },
          thumbnailFilename,
        );
      } catch {
        // Thumbnail generation failed, continue without thumbnail
        console.error('Thumbnail generation failed');
      }
    }

    // Create file record
    const fileEntity = await this.fileRepository.create({
      userId,
      originalName: file.originalname,
      storagePath,
      storageType: storageType as 'local' | 's3',
      mimeType: file.mimetype,
      size: BigInt(file.size),
      isImage,
      thumbnailPath,
    });

    // Update user storage usage
    await this.userRepository.incrementStorageUsed(userId, BigInt(file.size));

    return fileEntity;
  }

  async getFiles(options: FindFilesOptions) {
    return this.fileRepository.findByUserId(options);
  }

  async getFileById(fileId: string, userId: string): Promise<FileEntity> {
    const file = await this.fileRepository.findByIdAndUserId(fileId, userId);

    if (!file) {
      const exists = await this.fileRepository.findById(fileId);
      if (exists) {
        throw new FileAccessDeniedException(fileId, userId);
      }
      throw new FileNotFoundException(fileId);
    }

    return file;
  }

  async downloadFile(
    fileId: string,
    userId: string,
  ): Promise<{ stream: Readable; file: FileEntity }> {
    const file = await this.getFileById(fileId, userId);
    const stream = await this.storageStrategy.getStream(file.storagePath);

    return { stream, file };
  }

  async getThumbnail(
    fileId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; file: FileEntity }> {
    const file = await this.getFileById(fileId, userId);

    if (!file.isImage || !file.thumbnailPath) {
      throw new ThumbnailNotAvailableException(fileId);
    }

    const buffer = await this.storageStrategy.get(file.thumbnailPath);

    return { buffer, file };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.getFileById(fileId, userId);

    // Delete from storage
    await this.storageStrategy.delete(file.storagePath);

    // Delete thumbnail if exists
    if (file.thumbnailPath) {
      try {
        await this.storageStrategy.delete(file.thumbnailPath);
      } catch {
        // Ignore thumbnail deletion errors
      }
    }

    // Delete from database
    await this.fileRepository.delete(fileId);

    // Update user storage usage
    await this.userRepository.decrementStorageUsed(userId, file.size);
  }

  async getStorageUsage(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      used: Number(user.storageUsed),
      limit: Number(user.storageLimit),
      available: Number(user.getAvailableStorage()),
      usagePercentage: user.getStorageUsagePercentage(),
    };
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }
}
