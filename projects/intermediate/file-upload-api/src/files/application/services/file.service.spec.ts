import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FileService } from './file.service';
import { ThumbnailService } from './thumbnail.service';
import { FILE_REPOSITORY } from '../../domain/repositories/file.repository.interface';
import { USER_REPOSITORY } from '../../../users/domain/repositories/user.repository.interface';
import { STORAGE_STRATEGY } from '../../domain/strategies/storage.strategy.interface';
import { FileEntity } from '../../domain/entities/file.entity';
import { User } from '../../../users/domain/entities/user.entity';
import {
  FileNotFoundException,
  FileAccessDeniedException,
  StorageQuotaExceededException,
  InvalidFileTypeException,
  FileTooLargeException,
} from '../../domain/exceptions/file.exceptions';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FileService', () => {
  let service: FileService;
  let fileRepository: any;
  let userRepository: any;
  let storageStrategy: any;
  let thumbnailService: any;

  const mockUser = new User({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    storageUsed: BigInt(1000),
    storageLimit: BigInt(104857600),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockFile = new FileEntity({
    id: 'file-123',
    userId: 'user-123',
    originalName: 'test.txt',
    storagePath: 'abc123.txt',
    storageType: 'local',
    mimeType: 'text/plain',
    size: BigInt(1000),
    isImage: false,
    thumbnailPath: null,
    uploadedAt: new Date(),
  });

  const mockImageFile = new FileEntity({
    id: 'image-123',
    userId: 'user-123',
    originalName: 'test.png',
    storagePath: 'abc123.png',
    storageType: 'local',
    mimeType: 'image/png',
    size: BigInt(5000),
    isImage: true,
    thumbnailPath: 'thumb_abc123.webp',
    uploadedAt: new Date(),
  });

  beforeEach(async () => {
    fileRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
      getTotalSizeByUserId: jest.fn(),
    };

    userRepository = {
      findById: jest.fn(),
      incrementStorageUsed: jest.fn(),
      decrementStorageUsed: jest.fn(),
    };

    storageStrategy = {
      save: jest.fn(),
      get: jest.fn(),
      getStream: jest.fn(),
      delete: jest.fn(),
    };

    thumbnailService = {
      isImageMimeType: jest.fn(),
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: FILE_REPOSITORY,
          useValue: fileRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: STORAGE_STRATEGY,
          useValue: storageStrategy,
        },
        {
          provide: ThumbnailService,
          useValue: thumbnailService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                upload: {
                  maxFileSize: 10485760,
                  allowedMimeTypes: ['text/plain', 'image/png', 'image/jpeg'],
                  thumbnailWidth: 200,
                  thumbnailHeight: 200,
                },
                storage: {
                  type: 'local',
                },
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    const mockStorageFile = {
      buffer: Buffer.from('test content'),
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 1000,
    };

    it('should upload a file successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      storageStrategy.save.mockResolvedValue('stored-file.txt');
      thumbnailService.isImageMimeType.mockReturnValue(false);
      fileRepository.create.mockResolvedValue(mockFile);

      const result = await service.uploadFile(mockStorageFile, 'user-123');

      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
      expect(storageStrategy.save).toHaveBeenCalled();
      expect(fileRepository.create).toHaveBeenCalled();
      expect(userRepository.incrementStorageUsed).toHaveBeenCalledWith(
        'user-123',
        BigInt(1000),
      );
      expect(result).toEqual(mockFile);
    });

    it('should throw FileTooLargeException if file exceeds max size', async () => {
      const largeFile = { ...mockStorageFile, size: 20000000 };

      await expect(service.uploadFile(largeFile, 'user-123')).rejects.toThrow(
        FileTooLargeException,
      );
    });

    it('should throw InvalidFileTypeException for unsupported MIME type', async () => {
      const invalidFile = { ...mockStorageFile, mimetype: 'application/exe' };

      await expect(service.uploadFile(invalidFile, 'user-123')).rejects.toThrow(
        InvalidFileTypeException,
      );
    });

    it('should throw StorageQuotaExceededException if quota exceeded', async () => {
      const userNearLimit = new User({
        ...mockUser,
        storageUsed: BigInt(104857000),
        storageLimit: BigInt(104857600),
      });
      userRepository.findById.mockResolvedValue(userNearLimit);

      await expect(
        service.uploadFile(mockStorageFile, 'user-123'),
      ).rejects.toThrow(StorageQuotaExceededException);
    });

    it('should generate thumbnail for image files', async () => {
      const imageFile = {
        buffer: Buffer.from('image content'),
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 5000,
      };

      userRepository.findById.mockResolvedValue(mockUser);
      storageStrategy.save.mockResolvedValue('stored-image.png');
      thumbnailService.isImageMimeType.mockReturnValue(true);
      thumbnailService.generate.mockResolvedValue(Buffer.from('thumbnail'));
      fileRepository.create.mockResolvedValue(mockImageFile);

      await service.uploadFile(imageFile, 'user-123');

      expect(thumbnailService.generate).toHaveBeenCalled();
      expect(storageStrategy.save).toHaveBeenCalledTimes(2); // Original + thumbnail
    });
  });

  describe('getFileById', () => {
    it('should return file if user owns it', async () => {
      fileRepository.findByIdAndUserId.mockResolvedValue(mockFile);

      const result = await service.getFileById('file-123', 'user-123');

      expect(result).toEqual(mockFile);
    });

    it('should throw FileNotFoundException if file does not exist', async () => {
      fileRepository.findByIdAndUserId.mockResolvedValue(null);
      fileRepository.findById.mockResolvedValue(null);

      await expect(service.getFileById('file-123', 'user-123')).rejects.toThrow(
        FileNotFoundException,
      );
    });

    it('should throw FileAccessDeniedException if user does not own file', async () => {
      fileRepository.findByIdAndUserId.mockResolvedValue(null);
      fileRepository.findById.mockResolvedValue(mockFile);

      await expect(
        service.getFileById('file-123', 'other-user'),
      ).rejects.toThrow(FileAccessDeniedException);
    });
  });

  describe('downloadFile', () => {
    it('should return file stream and metadata', async () => {
      const mockStream = { pipe: jest.fn() };
      fileRepository.findByIdAndUserId.mockResolvedValue(mockFile);
      storageStrategy.getStream.mockResolvedValue(mockStream);

      const result = await service.downloadFile('file-123', 'user-123');

      expect(result.stream).toEqual(mockStream);
      expect(result.file).toEqual(mockFile);
    });
  });

  describe('getThumbnail', () => {
    it('should return thumbnail buffer for image files', async () => {
      const thumbnailBuffer = Buffer.from('thumbnail data');
      fileRepository.findByIdAndUserId.mockResolvedValue(mockImageFile);
      storageStrategy.get.mockResolvedValue(thumbnailBuffer);

      const result = await service.getThumbnail('image-123', 'user-123');

      expect(result.buffer).toEqual(thumbnailBuffer);
      expect(storageStrategy.get).toHaveBeenCalledWith('thumb_abc123.webp');
    });

    it('should throw ThumbnailNotAvailableException for non-image files', async () => {
      fileRepository.findByIdAndUserId.mockResolvedValue(mockFile);

      await expect(
        service.getThumbnail('file-123', 'user-123'),
      ).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and update storage usage', async () => {
      fileRepository.findByIdAndUserId.mockResolvedValue(mockFile);

      await service.deleteFile('file-123', 'user-123');

      expect(storageStrategy.delete).toHaveBeenCalledWith(mockFile.storagePath);
      expect(fileRepository.delete).toHaveBeenCalledWith('file-123');
      expect(userRepository.decrementStorageUsed).toHaveBeenCalledWith(
        'user-123',
        mockFile.size,
      );
    });

    it('should also delete thumbnail for image files', async () => {
      fileRepository.findByIdAndUserId.mockResolvedValue(mockImageFile);

      await service.deleteFile('image-123', 'user-123');

      expect(storageStrategy.delete).toHaveBeenCalledWith(
        mockImageFile.storagePath,
      );
      expect(storageStrategy.delete).toHaveBeenCalledWith(
        mockImageFile.thumbnailPath,
      );
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage stats', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getStorageUsage('user-123');

      expect(result).toEqual({
        used: Number(mockUser.storageUsed),
        limit: Number(mockUser.storageLimit),
        available: Number(mockUser.storageLimit - mockUser.storageUsed),
        usagePercentage: expect.any(Number),
      });
    });
  });

  describe('getFiles', () => {
    it('should return paginated files', async () => {
      const mockResult = { files: [mockFile], total: 1 };
      fileRepository.findByUserId.mockResolvedValue(mockResult);

      const result = await service.getFiles({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockResult);
    });
  });
});
