import { IsNotEmpty, IsUUID } from 'class-validator';

export class TypingIndicatorDto {
  @IsUUID('4')
  @IsNotEmpty()
  conversationId: string;
}

export class PresenceUpdateDto {
  status: 'online' | 'away' | 'busy';
}
