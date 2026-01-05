import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { FileService } from '../../application/services/file.service';
import { FileMapper } from '../../application/mappers/file.mapper';
import { FileQueryDto } from '../../application/dto/file-query.dto';
import {
  FileResponseDto,
  FileListResponseDto,
  StorageUsageDto,
} from '../../application/dto/file-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../../common/decorators/current-user.decorator';
import type { StorageFile } from '../../domain/strategies/storage.strategy.interface';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('api/v1/files')
export class FilesController {
  constructor(
    private readonly fileService: FileService,
    private readonly fileMapper: FileMapper,
  ) {}

  @Post('upload')
  @Throttle(
    process.env.NODE_ENV === 'test'
      ? {
          short: { limit: 10000, ttl: 1000 },
          medium: { limit: 10000, ttl: 10000 },
          long: { limit: 10000, ttl: 60000 },
        }
      : {
          short: { limit: 1, ttl: 1000 }, // 1 upload per second
          medium: { limit: 5, ttl: 10000 }, // 5 uploads per 10 seconds
          long: { limit: 20, ttl: 60000 }, // 20 uploads per minute
        },
  )
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @ApiResponse({ status: 507, description: 'Storage quota exceeded' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const storageFile: StorageFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const uploadedFile = await this.fileService.uploadFile(
      storageFile,
      user.id,
    );

    return this.fileMapper.toResponseDto(uploadedFile);
  }

  @Get()
  @ApiOperation({ summary: 'List user files' })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  async findAll(
    @Query() query: FileQueryDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const { files, total } = await this.fileService.getFiles({
      userId: user.id,
      page: query.page,
      limit: query.limit,
      mimeType: query.mimeType,
      search: query.search,
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: this.fileMapper.toResponseDtoList(files),
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total,
        pages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  @Get('storage')
  @ApiOperation({ summary: 'Get storage usage' })
  @ApiResponse({
    status: 200,
    description: 'Storage usage retrieved',
    type: StorageUsageDto,
  })
  async getStorageUsage(@CurrentUser() user: CurrentUserData) {
    return this.fileService.getStorageUsage(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file details' })
  @ApiResponse({
    status: 200,
    description: 'File details retrieved',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const file = await this.fileService.getFileById(id, user.id);
    return this.fileMapper.toResponseDto(file);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  @ApiResponse({ status: 200, description: 'File download' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const { stream, file } = await this.fileService.downloadFile(id, user.id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    res.setHeader('Content-Length', file.size.toString());

    stream.pipe(res);
  }

  @Get(':id/thumbnail')
  @ApiOperation({ summary: 'Get image thumbnail' })
  @ApiResponse({ status: 200, description: 'Thumbnail image' })
  @ApiResponse({ status: 400, description: 'Not an image' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getThumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const { buffer } = await this.fileService.getThumbnail(id, user.id);

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 204, description: 'File deleted' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.fileService.deleteFile(id, user.id);
  }
}
