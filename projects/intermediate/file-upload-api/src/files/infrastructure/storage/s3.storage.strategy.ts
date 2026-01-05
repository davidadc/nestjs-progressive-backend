import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import {
  IStorageStrategy,
  StorageFile,
} from '../../domain/strategies/storage.strategy.interface';
import { StorageException } from '../../domain/exceptions/file.exceptions';
import type { StorageConfig } from '../../../config';

@Injectable()
export class S3StorageStrategy implements IStorageStrategy {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const storageConfig = this.configService.get<StorageConfig>('storage')!;
    const { region, accessKeyId, secretAccessKey, bucket } = storageConfig.s3;

    this.bucket = bucket;

    this.s3Client = new S3Client({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }

  async save(file: StorageFile, filename: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      return filename;
    } catch (error) {
      throw new StorageException(
        `Failed to upload to S3: ${(error as Error).message}`,
      );
    }
  }

  async get(storagePath: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;

      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Uint8Array);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      throw new StorageException(
        `Failed to get file from S3: ${(error as Error).message}`,
      );
    }
  }

  async getStream(storagePath: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error) {
      throw new StorageException(
        `Failed to get file stream from S3: ${(error as Error).message}`,
      );
    }
  }

  async delete(storagePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new StorageException(
        `Failed to delete from S3: ${(error as Error).message}`,
      );
    }
  }

  async getUrl(storagePath: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      // Generate a presigned URL valid for 1 hour
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      throw new StorageException(
        `Failed to generate S3 URL: ${(error as Error).message}`,
      );
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
