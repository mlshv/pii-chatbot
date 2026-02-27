import type { InferSelectModel } from "drizzle-orm";
import { json, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const chat = pgTable("chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  parts: json("parts").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DBMessage = InferSelectModel<typeof message>;
