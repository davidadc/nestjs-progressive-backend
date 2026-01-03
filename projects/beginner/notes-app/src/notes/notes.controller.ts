import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { FindNotesDto, SearchNotesDto } from './dto/find-notes.dto';
import {
  NoteResponseDto,
  PaginatedNotesResponseDto,
} from './dto/note-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all notes with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of notes',
    type: PaginatedNotesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: User,
    @Query() dto: FindNotesDto,
  ): Promise<PaginatedNotesResponseDto> {
    return this.notesService.findAll(user.id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search notes by title and content' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of matching notes',
    type: PaginatedNotesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async search(
    @CurrentUser() user: User,
    @Query() dto: SearchNotesDto,
  ): Promise<PaginatedNotesResponseDto> {
    return this.notesService.search(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({
    status: 200,
    description: 'Note details',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your note' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({
    status: 200,
    description: 'Note updated successfully',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your note' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note (soft delete)' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 204, description: 'Note deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your note' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notesService.remove(user.id, id);
  }
}
