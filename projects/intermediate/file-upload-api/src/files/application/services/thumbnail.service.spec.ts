import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ThumbnailService } from './thumbnail.service';

// Mock sharp module
const mockSharpInstance = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  toBuffer: jest.fn(),
  metadata: jest.fn(),
};

jest.mock('sharp', () => {
  return jest.fn(() => mockSharpInstance);
});

describe('ThumbnailService', () => {
  let service: ThumbnailService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThumbnailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'upload') {
                return {
                  thumbnailWidth: 200,
                  thumbnailHeight: 200,
                };
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ThumbnailService>(ThumbnailService);
  });

  describe('generate', () => {
    const mockBuffer = Buffer.from('test image data');
    const mockOutputBuffer = Buffer.from('thumbnail data');

    beforeEach(() => {
      mockSharpInstance.toBuffer.mockResolvedValue(mockOutputBuffer);
    });

    it('should generate thumbnail with default options', async () => {
      const result = await service.generate(mockBuffer);

      expect(result).toEqual(mockOutputBuffer);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(200, 200, {
        fit: 'cover',
        position: 'center',
      });
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 80 });
    });

    it('should generate thumbnail with custom dimensions', async () => {
      const result = await service.generate(mockBuffer, {
        width: 100,
        height: 150,
      });

      expect(result).toEqual(mockOutputBuffer);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(100, 150, {
        fit: 'cover',
        position: 'center',
      });
    });

    it('should generate jpeg thumbnail', async () => {
      await service.generate(mockBuffer, { format: 'jpeg' });

      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharpInstance.webp).not.toHaveBeenCalled();
    });

    it('should generate png thumbnail', async () => {
      await service.generate(mockBuffer, { format: 'png' });

      expect(mockSharpInstance.png).toHaveBeenCalledWith({
        compressionLevel: 6,
      });
      expect(mockSharpInstance.webp).not.toHaveBeenCalled();
    });

    it('should generate webp thumbnail by default', async () => {
      await service.generate(mockBuffer);

      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 80 });
    });
  });

  describe('getMetadata', () => {
    it('should return image metadata', async () => {
      const mockMetadata = {
        width: 800,
        height: 600,
        format: 'png',
        size: 12345,
      };
      mockSharpInstance.metadata.mockResolvedValue(mockMetadata);

      const result = await service.getMetadata(Buffer.from('test'));

      expect(result).toEqual(mockMetadata);
    });
  });

  describe('isImageMimeType', () => {
    it('should return true for supported image types', () => {
      expect(service.isImageMimeType('image/jpeg')).toBe(true);
      expect(service.isImageMimeType('image/png')).toBe(true);
      expect(service.isImageMimeType('image/gif')).toBe(true);
      expect(service.isImageMimeType('image/webp')).toBe(true);
      expect(service.isImageMimeType('image/tiff')).toBe(true);
      expect(service.isImageMimeType('image/avif')).toBe(true);
    });

    it('should return false for unsupported types', () => {
      expect(service.isImageMimeType('text/plain')).toBe(false);
      expect(service.isImageMimeType('application/pdf')).toBe(false);
      expect(service.isImageMimeType('image/svg+xml')).toBe(false);
      expect(service.isImageMimeType('video/mp4')).toBe(false);
    });

    it('should return false for empty or invalid MIME types', () => {
      expect(service.isImageMimeType('')).toBe(false);
      expect(service.isImageMimeType('invalid')).toBe(false);
    });
  });
});
