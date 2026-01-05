import { Injectable } from '@nestjs/common';
import { FileEntity } from '../../domain/entities/file.entity';
import { FileResponseDto } from '../dto/file-response.dto';

@Injectable()
export class FileMapper {
  toResponseDto(file: FileEntity): FileResponseDto {
    const dto = new FileResponseDto();
    dto.id = file.id;
    dto.originalName = file.originalName;
    dto.mimeType = file.mimeType;
    dto.size = Number(file.size);
    dto.isImage = file.isImage;
    dto.url = `/api/v1/files/${file.id}/download`;
    dto.uploadedAt = file.uploadedAt;

    if (file.isImage && file.thumbnailPath) {
      dto.thumbnailUrl = `/api/v1/files/${file.id}/thumbnail`;
    }

    return dto;
  }

  toResponseDtoList(files: FileEntity[]): FileResponseDto[] {
    return files.map((file) => this.toResponseDto(file));
  }
}
