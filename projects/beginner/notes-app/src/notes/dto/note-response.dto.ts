import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Note } from '../entities/note.entity';

export class NoteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'My First Note' })
  title: string;

  @ApiPropertyOptional({ example: 'This is the content of my note.' })
  content: string | null;

  @ApiProperty({ example: '2026-01-03T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-03T10:00:00.000Z' })
  updatedAt: Date;

  constructor(note: Note) {
    this.id = note.id;
    this.title = note.title;
    this.content = note.content;
    this.createdAt = note.createdAt;
    this.updatedAt = note.updatedAt;
  }
}

export class PaginatedNotesResponseDto {
  @ApiProperty({ type: [NoteResponseDto] })
  data: NoteResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 10, total: 25, totalPages: 3 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
