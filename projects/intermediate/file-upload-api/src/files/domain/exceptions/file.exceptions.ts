export class FileNotFoundException extends Error {
  constructor(fileId: string) {
    super(`File with ID '${fileId}' not found`);
    this.name = 'FileNotFoundException';
  }
}

export class FileAccessDeniedException extends Error {
  constructor(fileId: string, userId: string) {
    super(`User '${userId}' does not have access to file '${fileId}'`);
    this.name = 'FileAccessDeniedException';
  }
}

export class StorageQuotaExceededException extends Error {
  required: bigint;
  available: bigint;

  constructor(required: bigint, available: bigint) {
    super(
      `Storage quota exceeded. Required: ${required} bytes, Available: ${available} bytes`,
    );
    this.name = 'StorageQuotaExceededException';
    this.required = required;
    this.available = available;
  }
}

export class InvalidFileTypeException extends Error {
  mimeType: string;
  allowedTypes: string[];

  constructor(mimeType: string, allowedTypes: string[]) {
    super(
      `File type '${mimeType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    );
    this.name = 'InvalidFileTypeException';
    this.mimeType = mimeType;
    this.allowedTypes = allowedTypes;
  }
}

export class FileTooLargeException extends Error {
  fileSize: number;
  maxSize: number;

  constructor(fileSize: number, maxSize: number) {
    super(
      `File size (${fileSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
    );
    this.name = 'FileTooLargeException';
    this.fileSize = fileSize;
    this.maxSize = maxSize;
  }
}

export class ThumbnailNotAvailableException extends Error {
  constructor(fileId: string) {
    super(`Thumbnail not available for file '${fileId}'`);
    this.name = 'ThumbnailNotAvailableException';
  }
}

export class StorageException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageException';
  }
}
