import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const cedict_entries = pgTable("cedict", {
  entry: text().primaryKey(),
  pinyin: text().notNull(),
  definition: text().notNull(),
  
  // Optional columns (no .notNull())
  hsk: integer(),
  frequency: integer(),
  frequency_rank: integer(),
  char_rank: integer(),
});

export const char_bank = pgTable("char_bank", {
  char: text().primaryKey().references(() => cedict_entries.entry),
  date_added: text().notNull(),       // ISO timestamp
  mastered: integer().default(0),     // 0 = learning, 1 = learnt
});
