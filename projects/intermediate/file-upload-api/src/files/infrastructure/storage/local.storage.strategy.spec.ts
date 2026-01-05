import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalStorageStrategy } from './local.storage.strategy';
import { StorageException } from '../../domain/exceptions/file.exceptions';
import * as fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { Readable } from 'stream';

jest.mock('fs/promises');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
}));

describe('LocalStorageStrategy', () => {
  let strategy: LocalStorageStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'storage') {
        return {
          type: 'local',
          local: {
            uploadDir: './uploads',
          },
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStorageStrategy>(LocalStorageStrategy);
  });

  describe('save', () => {
    const mockFile = {
      buffer: Buffer.from('test content'),
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 12,
    };

    it('should save file successfully', async () => {
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await strategy.save(mockFile, 'stored-file.txt');

      expect(result).toBe('stored-file.txt');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('stored-file.txt'),
        mockFile.buffer,
      );
    });

    it('should throw StorageException on write failure', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await expect(strategy.save(mockFile, 'stored-file.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('get', () => {
    it('should read file successfully', async () => {
      const mockBuffer = Buffer.from('file content');
      (fs.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await strategy.get('stored-file.txt');

      expect(result).toEqual(mockBuffer);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('stored-file.txt'),
      );
    });

    it('should throw StorageException on read failure', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Read failed'));

      await expect(strategy.get('nonexistent.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('getStream', () => {
    it('should return readable stream for existing file', async () => {
      const mockStream = new Readable();
      (existsSync as jest.Mock).mockReturnValue(true);
      (createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = await strategy.getStream('stored-file.txt');

      expect(result).toBe(mockStream);
      expect(existsSync).toHaveBeenCalledWith(
        expect.stringContaining('stored-file.txt'),
      );
    });

    it('should throw StorageException if file does not exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      await expect(strategy.getStream('nonexistent.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await expect(strategy.delete('stored-file.txt')).resolves.not.toThrow();
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('stored-file.txt'),
      );
    });

    it('should not throw if file does not exist (ENOENT)', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      (fs.unlink as jest.Mock).mockRejectedValue(error);

      await expect(strategy.delete('nonexistent.txt')).resolves.not.toThrow();
    });

    it('should throw StorageException on other delete errors', async () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      (fs.unlink as jest.Mock).mockRejectedValue(error);

      await expect(strategy.delete('protected.txt')).rejects.toThrow(
        StorageException,
      );
    });
  });

  describe('getUrl', () => {
    it('should return API download endpoint', async () => {
      const result = await strategy.getUrl('stored-file.txt');

      expect(result).toBe('/api/v1/files/stored-file.txt/download');
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      (existsSync as jest.Mock).mockReturnValue(true);

      const result = await strategy.exists('stored-file.txt');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      const result = await strategy.exists('nonexistent.txt');

      expect(result).toBe(false);
    });
  });
});
