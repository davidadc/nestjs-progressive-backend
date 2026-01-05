export class ConversationEntity {
  id: string;
  name?: string | null;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ConversationEntity>) {
    Object.assign(this, partial);
  }

  static create(props: {
    name?: string;
    isGroup?: boolean;
  }): ConversationEntity {
    return new ConversationEntity({
      name: props.name,
      isGroup: props.isGroup ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
