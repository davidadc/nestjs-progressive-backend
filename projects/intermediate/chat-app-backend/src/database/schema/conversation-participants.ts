import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    id: uuid('id').defaultRandom().notNull(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    leftAt: timestamp('left_at'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.userId] }),
  }),
);

export type ConversationParticipant =
  typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant =
  typeof conversationParticipants.$inferInsert;
