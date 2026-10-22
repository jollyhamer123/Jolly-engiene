import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
export const library = pgTable('visitor_library', {
  id: uuid().defaultRandom().primaryKey(),
  owner: text().notNull(),
  kind: text().notNull(),
  view: text().notNull(),
  value: text().notNull(),
  title: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('visitor_library_owner_kind').on(table.owner, table.kind)]);
