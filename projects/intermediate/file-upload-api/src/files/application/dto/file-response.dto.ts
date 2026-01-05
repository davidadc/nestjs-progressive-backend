import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({
    description: 'File ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
  })
  size: number;

  @ApiProperty({
    description: 'Whether the file is an image',
    example: false,
  })
  isImage: boolean;

  @ApiProperty({
    description: 'URL to download the file',
    example: '/api/v1/files/550e8400-e29b-41d4-a716-446655440000/download',
  })
  url: string;

  @ApiPropertyOptional({
    description: 'URL to get thumbnail (only for images)',
    example: '/api/v1/files/550e8400-e29b-41d4-a716-446655440000/thumbnail',
  })
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2026-01-05T10:00:00Z',
  })
  uploadedAt: Date;
}

export class StorageUsageDto {
  @ApiProperty({
    description: 'Storage used in bytes',
    example: 52428800,
  })
  used: number;

  @ApiProperty({
    description: 'Storage limit in bytes',
    example: 104857600,
  })
  limit: number;

  @ApiProperty({
    description: 'Available storage in bytes',
    example: 52428800,
  })
  available: number;

  @ApiProperty({
    description: 'Usage percentage',
    example: 50,
  })
  usagePercentage: number;
}

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 5 })
  pages: number;
}

export class FileListResponseDto {
  @ApiProperty({ type: [FileResponseDto] })
  data: FileResponseDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}
