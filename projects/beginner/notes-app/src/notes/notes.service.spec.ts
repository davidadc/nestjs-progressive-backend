/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesRepository } from './notes.repository';
import { Note } from './entities/note.entity';

describe('NotesService', () => {
  let service: NotesService;
  let repository: jest.Mocked<NotesRepository>;

  const mockNote: Note = {
    id: 'note-uuid-1',
    title: 'Test Note',
    content: 'Test content',
    userId: 'user-uuid-1',
    createdAt: new Date('2026-01-03T10:00:00.000Z'),
    updatedAt: new Date('2026-01-03T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockNotesRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: NotesRepository,
          useValue: mockNotesRepository,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repository = module.get(NotesRepository);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a note for the user', async () => {
      repository.create.mockResolvedValue(mockNote);

      const result = await service.create('user-uuid-1', {
        title: 'Test Note',
        content: 'Test content',
      });

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test Note',
        content: 'Test content',
        userId: 'user-uuid-1',
      });
      expect(result.id).toBe(mockNote.id);
      expect(result.title).toBe(mockNote.title);
    });

    it('should create a note without content', async () => {
      const noteWithoutContent = { ...mockNote, content: null };
      repository.create.mockResolvedValue(noteWithoutContent);

      const result = await service.create('user-uuid-1', {
        title: 'Test Note',
      });

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test Note',
        content: undefined,
        userId: 'user-uuid-1',
      });
      expect(result.content).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated notes for the user', async () => {
      repository.findAll.mockResolvedValue({
        data: [mockNote],
        total: 1,
      });

      const result = await service.findAll('user-uuid-1', {
        page: 1,
        limit: 10,
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should use default pagination when not provided', async () => {
      repository.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAll('user-uuid-1', {});

      expect(repository.findAll).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('search', () => {
    it('should search notes by query', async () => {
      repository.findAll.mockResolvedValue({
        data: [mockNote],
        total: 1,
      });

      const result = await service.search('user-uuid-1', {
        q: 'test',
        page: 1,
        limit: 10,
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        page: 1,
        limit: 10,
        search: 'test',
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a note if user owns it', async () => {
      repository.findById.mockResolvedValue(mockNote);

      const result = await service.findOne('user-uuid-1', 'note-uuid-1');

      expect(result.id).toBe(mockNote.id);
    });

    it('should throw NotFoundException if note does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findOne('user-uuid-1', 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the note', async () => {
      repository.findById.mockResolvedValue(mockNote);

      await expect(
        service.findOne('other-user-uuid', 'note-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update note fields', async () => {
      const updatedNote = { ...mockNote, title: 'Updated Title' };
      repository.findById.mockResolvedValue(mockNote);
      repository.update.mockResolvedValue(updatedNote);

      const result = await service.update('user-uuid-1', 'note-uuid-1', {
        title: 'Updated Title',
      });

      expect(repository.update).toHaveBeenCalledWith('note-uuid-1', {
        title: 'Updated Title',
        content: undefined,
      });
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if note does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('user-uuid-1', 'non-existent-id', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the note', async () => {
      repository.findById.mockResolvedValue(mockNote);

      await expect(
        service.update('other-user-uuid', 'note-uuid-1', { title: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete the note', async () => {
      repository.findById.mockResolvedValue(mockNote);
      repository.softDelete.mockResolvedValue({
        ...mockNote,
        deletedAt: new Date(),
      });

      await service.remove('user-uuid-1', 'note-uuid-1');

      expect(repository.softDelete).toHaveBeenCalledWith('note-uuid-1');
    });

    it('should throw NotFoundException if note does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove('user-uuid-1', 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the note', async () => {
      repository.findById.mockResolvedValue(mockNote);

      await expect(
        service.remove('other-user-uuid', 'note-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
