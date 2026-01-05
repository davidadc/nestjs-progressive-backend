import { registerAs } from '@nestjs/config';

export interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  thumbnailWidth: number;
  thumbnailHeight: number;
  defaultStorageLimit: number;
}

export default registerAs(
  'upload',
  (): UploadConfig => ({
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES ||
      'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain'
    ).split(','),
    thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH || '200', 10),
    thumbnailHeight: parseInt(process.env.THUMBNAIL_HEIGHT || '200', 10),
    defaultStorageLimit: parseInt(
      process.env.DEFAULT_STORAGE_LIMIT || '104857600',
      10,
    ),
  }),
);
