import { ApiProperty } from '@nestjs/swagger';

export class MessageSenderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string | null;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty({ type: MessageSenderDto })
  sender: MessageSenderDto;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}
