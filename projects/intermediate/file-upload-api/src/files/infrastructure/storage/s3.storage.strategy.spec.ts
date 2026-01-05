import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3StorageStrategy } from './s3.storage.strategy';
import { StorageException } from '../../domain/exceptions/file.exceptions';
import { Readable } from 'stream';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ params })),
  GetObjectCommand: jest.fn().mockImplementation((params) => ({ params })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ params })),
  HeadObjectCommand: jest.fn().mockImplementation((params) => ({ params })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.presigned-url.com'),
}));

describe('S3StorageStrategy', () => {
  let strategy: S3StorageStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'storage') {
        return {
          type: 's3',
          s3: {
            region: 'us-east-1',
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
            bucket: 'test-bucket',
          },
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3StorageStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<S3StorageStrategy>(S3StorageStrategy);
  });

  describe('save', () => {
    const mockFile = {
      buffer: Buffer.from('test content'),
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 12,
    };

    it('should upload file to S3 successfully', async () => {
      mockSend.mockResolvedValue({});

      const result = await strategy.save(mockFile, 'stored-file.txt');

      expect(result).toBe('stored-file.txt');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw StorageException on S3 upload failure', async () => {
      mockSend.mockRejectedValue(new Error('S3 upload failed'));

      await expect(strategy.save(mockFile, 'stored-file.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('get', () => {
    it('should get file from S3 successfully', async () => {
      const mockBuffer = Buffer.from('file content');
      const mockStream = Readable.from([mockBuffer]);

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      const result = await strategy.get('stored-file.txt');

      expect(result).toEqual(mockBuffer);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw StorageException on S3 get failure', async () => {
      mockSend.mockRejectedValue(new Error('S3 get failed'));

      await expect(strategy.get('nonexistent.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('getStream', () => {
    it('should return stream from S3', async () => {
      const mockStream = Readable.from([Buffer.from('content')]);

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      const result = await strategy.getStream('stored-file.txt');

      expect(result).toBe(mockStream);
    });

    it('should throw StorageException on stream failure', async () => {
      mockSend.mockRejectedValue(new Error('Stream failed'));

      await expect(strategy.getStream('nonexistent.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('delete', () => {
    it('should delete file from S3 successfully', async () => {
      mockSend.mockResolvedValue({});

      await expect(strategy.delete('stored-file.txt')).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw StorageException on S3 delete failure', async () => {
      mockSend.mockRejectedValue(new Error('S3 delete failed'));

      await expect(strategy.delete('file.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('getUrl', () => {
    it('should return presigned URL', async () => {
      const result = await strategy.getUrl('stored-file.txt');

      expect(result).toBe('https://s3.presigned-url.com');
    });
  });

  describe('exists', () => {
    it('should return true if file exists in S3', async () => {
      mockSend.mockResolvedValue({});

      const result = await strategy.exists('stored-file.txt');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockSend.mockRejectedValue(new Error('Not found'));

      const result = await strategy.exists('nonexistent.txt');

      expect(result).toBe(false);
    });
  });
});
