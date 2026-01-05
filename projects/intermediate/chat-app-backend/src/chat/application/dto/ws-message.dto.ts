import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class WsSendMessageDto {
  @IsUUID('4')
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class WsJoinConversationDto {
  @IsUUID('4')
  @IsNotEmpty()
  conversationId: string;
}

export class WsLeaveConversationDto {
  @IsUUID('4')
  @IsNotEmpty()
  conversationId: string;
}
