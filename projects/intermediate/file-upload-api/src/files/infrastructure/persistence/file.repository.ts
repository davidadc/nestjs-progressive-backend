import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FileEntity, StorageType } from '../../domain/entities/file.entity';
import type {
  IFileRepository,
  CreateFileData,
  FindFilesOptions,
  FindFilesResult,
} from '../../domain/repositories/file.repository.interface';

@Injectable()
export class FileRepository implements IFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(fileData: CreateFileData): Promise<FileEntity> {
    const file = await this.prisma.file.create({
      data: {
        userId: fileData.userId,
        originalName: fileData.originalName,
        storagePath: fileData.storagePath,
        storageType: fileData.storageType,
        mimeType: fileData.mimeType,
        size: fileData.size,
        isImage: fileData.isImage,
        thumbnailPath: fileData.thumbnailPath,
      },
    });

    return new FileEntity({
      ...file,
      storageType: file.storageType as StorageType,
    });
  }

  async findById(id: string): Promise<FileEntity | null> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) return null;

    return new FileEntity({
      ...file,
      storageType: file.storageType as StorageType,
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<FileEntity | null> {
    const file = await this.prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) return null;

    return new FileEntity({
      ...file,
      storageType: file.storageType as StorageType,
    });
  }

  async findByUserId(options: FindFilesOptions): Promise<FindFilesResult> {
    const { userId, page = 1, limit = 10, mimeType, search } = options;

    const where: {
      userId: string;
      mimeType?: string;
      originalName?: { contains: string; mode: 'insensitive' };
    } = { userId };

    if (mimeType) {
      where.mimeType = mimeType;
    }

    if (search) {
      where.originalName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      files: files.map(
        (file) =>
          new FileEntity({
            ...file,
            storageType: file.storageType as StorageType,
          }),
      ),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.file.delete({
      where: { id },
    });
  }

  async getTotalSizeByUserId(userId: string): Promise<bigint> {
    const result = await this.prisma.file.aggregate({
      where: { userId },
      _sum: {
        size: true,
      },
    });

    return result._sum.size ?? BigInt(0);
  }
}
