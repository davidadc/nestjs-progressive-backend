import type { FileEntity, FileData } from '../entities/file.entity';

export type CreateFileData = Omit<FileData, 'id' | 'uploadedAt'>;

export interface FindFilesOptions {
  userId: string;
  page?: number;
  limit?: number;
  mimeType?: string;
  search?: string;
}

export interface FindFilesResult {
  files: FileEntity[];
  total: number;
}

export interface IFileRepository {
  create(file: CreateFileData): Promise<FileEntity>;
  findById(id: string): Promise<FileEntity | null>;
  findByIdAndUserId(id: string, userId: string): Promise<FileEntity | null>;
  findByUserId(options: FindFilesOptions): Promise<FindFilesResult>;
  delete(id: string): Promise<void>;
  getTotalSizeByUserId(userId: string): Promise<bigint>;
}

export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');
