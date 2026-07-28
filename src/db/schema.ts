import { integer, pgTable, text, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), 
  username: text("username").notNull(),
});

export const cedict_entries = pgTable("cedict", {
  entry: text().primaryKey(),
  pinyin: text().notNull(),
  definition: text().notNull(),

  // Optional columns (no .notNull())
  hsk: integer(),
  frequency: integer(),
  frequencyRank: integer(),
  charRank: integer(),
});

// Junction Dictionary table for our Many-To-Many relationship.
export const user_char_bank = pgTable("user_char_bank", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  char: text("char").notNull().references(() => cedict_entries.entry),
  date_added: text("date_added").notNull(), 
  mastered: integer("mastered").default(0),
}, (table) => [
  primaryKey({ name: "user_char_bank_pk", columns: [table.userId, table.char] })
]);