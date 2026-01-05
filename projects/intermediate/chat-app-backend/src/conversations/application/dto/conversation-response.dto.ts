import { ApiProperty } from '@nestjs/swagger';

export class ParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string | null;
}

export class LastMessageDto {
  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => ParticipantDto })
  sender: ParticipantDto;
}

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  name?: string | null;

  @ApiProperty()
  isGroup: boolean;

  @ApiProperty({ type: [ParticipantDto] })
  participants: ParticipantDto[];

  @ApiProperty({ type: LastMessageDto, required: false })
  lastMessage?: LastMessageDto | null;

  @ApiProperty()
  createdAt: Date;
}
