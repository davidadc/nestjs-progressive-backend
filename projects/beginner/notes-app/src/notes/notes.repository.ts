import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Note } from './entities/note.entity';

export interface CreateNoteData {
  title: string;
  content?: string;
  userId: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface FindNotesOptions {
  userId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

@Injectable()
export class NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNoteData): Promise<Note> {
    return this.prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        userId: data.userId,
      },
    });
  }

  async findById(id: string): Promise<Note | null> {
    return this.prisma.note.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Note | null> {
    return this.prisma.note.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  async findAll(options: FindNotesOptions): Promise<PaginatedResult<Note>> {
    const { userId, page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.note.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: UpdateNoteData): Promise<Note> {
    return this.prisma.note.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Note> {
    return this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
