export type StorageType = 'local' | 's3';

export interface FileData {
  id: string;
  userId: string;
  originalName: string;
  storagePath: string;
  storageType: StorageType;
  mimeType: string;
  size: bigint;
  isImage: boolean;
  thumbnailPath: string | null;
  uploadedAt: Date;
}

export class FileEntity implements FileData {
  id: string;
  userId: string;
  originalName: string;
  storagePath: string;
  storageType: StorageType;
  mimeType: string;
  size: bigint;
  isImage: boolean;
  thumbnailPath: string | null;
  uploadedAt: Date;

  constructor(data: FileData) {
    this.id = data.id;
    this.userId = data.userId;
    this.originalName = data.originalName;
    this.storagePath = data.storagePath;
    this.storageType = data.storageType;
    this.mimeType = data.mimeType;
    this.size = data.size;
    this.isImage = data.isImage;
    this.thumbnailPath = data.thumbnailPath;
    this.uploadedAt = data.uploadedAt;
  }

  static isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  hasThumbnail(): boolean {
    return this.isImage && this.thumbnailPath !== null;
  }

  getExtension(): string {
    const parts = this.originalName.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }
}
