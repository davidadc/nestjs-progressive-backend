import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, existsSync } from 'fs';
import { Readable } from 'stream';
import {
  IStorageStrategy,
  StorageFile,
} from '../../domain/strategies/storage.strategy.interface';
import { StorageException } from '../../domain/exceptions/file.exceptions';
import type { StorageConfig } from '../../../config';

@Injectable()
export class LocalStorageStrategy implements IStorageStrategy {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    const storageConfig = this.configService.get<StorageConfig>('storage')!;
    this.uploadDir = storageConfig.local.uploadDir;
    void this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async save(file: StorageFile, filename: string): Promise<string> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);
      return filename;
    } catch (error) {
      throw new StorageException(
        `Failed to save file: ${(error as Error).message}`,
      );
    }
  }

  async get(storagePath: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, storagePath);
      return await fs.readFile(filePath);
    } catch (error) {
      throw new StorageException(
        `Failed to read file: ${(error as Error).message}`,
      );
    }
  }

  getStream(storagePath: string): Promise<Readable> {
    const filePath = path.join(this.uploadDir, storagePath);

    if (!existsSync(filePath)) {
      return Promise.reject(
        new StorageException(`File not found: ${storagePath}`),
      );
    }

    return Promise.resolve(createReadStream(filePath));
  }

  async delete(storagePath: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, storagePath);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new StorageException(
          `Failed to delete file: ${(error as Error).message}`,
        );
      }
    }
  }

  getUrl(storagePath: string): Promise<string> {
    // For local storage, return the API endpoint
    return Promise.resolve(`/api/v1/files/${storagePath}/download`);
  }

  exists(storagePath: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, storagePath);
    return Promise.resolve(existsSync(filePath));
  }
}
