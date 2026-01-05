export class MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MessageEntity>) {
    Object.assign(this, partial);
  }

  static create(props: {
    conversationId: string;
    senderId: string;
    content: string;
  }): MessageEntity {
    return new MessageEntity({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
