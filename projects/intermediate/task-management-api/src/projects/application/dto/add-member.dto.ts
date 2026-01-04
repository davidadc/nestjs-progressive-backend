import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'uuid-of-user-to-add' })
  @IsUUID()
  userId: string;
}
