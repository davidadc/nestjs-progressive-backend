import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({ example: 'uuid-of-user-to-add' })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;
}
