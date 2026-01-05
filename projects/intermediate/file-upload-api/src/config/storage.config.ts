import { registerAs } from '@nestjs/config';

export type StorageType = 'local' | 's3';

export interface StorageConfig {
  type: StorageType;
  local: {
    uploadDir: string;
  };
  s3: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };
}

export default registerAs(
  'storage',
  (): StorageConfig => ({
    type: (process.env.STORAGE_TYPE as StorageType) || 'local',
    local: {
      uploadDir: process.env.UPLOAD_DIR || './uploads',
    },
    s3: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucket: process.env.AWS_S3_BUCKET || '',
    },
  }),
);
