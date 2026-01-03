import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotesRepository } from './notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { FindNotesDto, SearchNotesDto } from './dto/find-notes.dto';
import {
  NoteResponseDto,
  PaginatedNotesResponseDto,
} from './dto/note-response.dto';

@Injectable()
export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  async create(userId: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    const note = await this.notesRepository.create({
      title: dto.title,
      content: dto.content,
      userId,
    });

    return new NoteResponseDto(note);
  }

  async findAll(
    userId: string,
    dto: FindNotesDto,
  ): Promise<PaginatedNotesResponseDto> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const { data, total } = await this.notesRepository.findAll({
      userId,
      page,
      limit,
    });

    return {
      data: data.map((note) => new NoteResponseDto(note)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(
    userId: string,
    dto: SearchNotesDto,
  ): Promise<PaginatedNotesResponseDto> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const { data, total } = await this.notesRepository.findAll({
      userId,
      page,
      limit,
      search: dto.q,
    });

    return {
      data: data.map((note) => new NoteResponseDto(note)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, noteId: string): Promise<NoteResponseDto> {
    const note = await this.notesRepository.findById(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return new NoteResponseDto(note);
  }

  async update(
    userId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const note = await this.notesRepository.findById(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    const updatedNote = await this.notesRepository.update(noteId, {
      title: dto.title,
      content: dto.content,
    });

    return new NoteResponseDto(updatedNote);
  }

  async remove(userId: string, noteId: string): Promise<void> {
    const note = await this.notesRepository.findById(noteId);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    await this.notesRepository.softDelete(noteId);
  }
}
