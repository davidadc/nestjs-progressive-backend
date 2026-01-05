import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import type { UploadConfig } from '../../../config';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

@Injectable()
export class ThumbnailService {
  private readonly defaultWidth: number;
  private readonly defaultHeight: number;

  constructor(private readonly configService: ConfigService) {
    const uploadConfig = this.configService.get<UploadConfig>('upload')!;
    this.defaultWidth = uploadConfig.thumbnailWidth;
    this.defaultHeight = uploadConfig.thumbnailHeight;
  }

  async generate(buffer: Buffer, options?: ThumbnailOptions): Promise<Buffer> {
    const width = options?.width ?? this.defaultWidth;
    const height = options?.height ?? this.defaultHeight;
    const format = options?.format ?? 'webp';

    let sharpInstance = sharp(buffer).resize(width, height, {
      fit: 'cover',
      position: 'center',
    });

    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: 80 });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: 80 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ compressionLevel: 6 });
        break;
    }

    return sharpInstance.toBuffer();
  }

  async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return sharp(buffer).metadata();
  }

  isImageMimeType(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff',
      'image/avif',
    ];
    return supportedTypes.includes(mimeType);
  }
}
