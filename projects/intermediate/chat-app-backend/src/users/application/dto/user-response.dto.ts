import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class OnlineUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string | null;

  @ApiProperty({ enum: ['online', 'away', 'busy'] })
  status: 'online' | 'away' | 'busy';
}
