export class ConversationParticipantEntity {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date | null;

  constructor(partial: Partial<ConversationParticipantEntity>) {
    Object.assign(this, partial);
  }

  static create(props: {
    conversationId: string;
    userId: string;
  }): ConversationParticipantEntity {
    return new ConversationParticipantEntity({
      ...props,
      joinedAt: new Date(),
    });
  }
}
