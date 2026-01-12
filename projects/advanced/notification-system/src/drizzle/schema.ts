import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'order_completed',
  'new_comment',
  'new_follower',
  'liked_post',
  'mention',
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Notifications table
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().default({}),
    read: boolean('read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_user_read_idx').on(table.userId, table.read),
    index('notifications_created_at_idx').on(table.createdAt),
  ],
);

// Channel preferences type
export type ChannelPreferences = {
  email: boolean;
  push: boolean;
  sms: boolean;
};

// Per-type preferences type
export type PerTypePreferences = {
  order_completed?: ChannelPreferences;
  new_comment?: ChannelPreferences;
  new_follower?: ChannelPreferences;
  liked_post?: ChannelPreferences;
  mention?: ChannelPreferences;
};

// Notification preferences table
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  email: boolean('email').notNull().default(true),
  push: boolean('push').notNull().default(true),
  sms: boolean('sms').notNull().default(false),
  perTypePrefs: jsonb('per_type_prefs')
    .$type<PerTypePreferences>()
    .default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Type exports for use in repositories
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type NotificationPreferenceRow =
  typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
  typeof notificationPreferences.$inferInsert;
