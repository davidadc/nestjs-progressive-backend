import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  statusCode: number;

  data: T;

  @ApiProperty({ required: false })
  message?: string;

  constructor(data: T, statusCode: number = 200, message?: string) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}

export class ApiErrorResponseDto {
  @ApiProperty()
  success: boolean = false;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  error: string;

  @ApiProperty({ required: false })
  timestamp?: string;
}
