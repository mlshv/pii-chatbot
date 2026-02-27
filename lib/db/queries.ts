import "server-only";

import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "./index";
import { type Chat, type DBMessage, chat, message } from "./schema";

export async function getChatsByUserId(userId: string): Promise<Chat[]> {
  return db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.createdAt));
}

export async function getChatById(id: string): Promise<Chat | undefined> {
  const [result] = await db.select().from(chat).where(eq(chat.id, id));
  return result;
}

export async function createChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  return db.insert(chat).values({ id, userId, title, createdAt: new Date() });
}

export async function updateChatTitle(id: string, title: string) {
  return db.update(chat).set({ title }).where(eq(chat.id, id));
}

export async function deleteChat(id: string) {
  await db.delete(message).where(eq(message.chatId, id));
  return db.delete(chat).where(eq(chat.id, id));
}

export async function getMessagesByChatId(chatId: string): Promise<DBMessage[]> {
  return db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));
}

export async function saveMessages(messages: Omit<DBMessage, "createdAt">[]) {
  if (messages.length === 0) return;
  return db.insert(message).values(
    messages.map((m) => ({ ...m, createdAt: new Date() }))
  );
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const toDelete = await db
    .select({ id: message.id })
    .from(message)
    .where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)));

  const ids = toDelete.map((m) => m.id);
  if (ids.length > 0) {
    await db.delete(message).where(inArray(message.id, ids));
  }
}

export async function deleteAllChatsByUserId(userId: string) {
  const userChats = await db
    .select({ id: chat.id })
    .from(chat)
    .where(eq(chat.userId, userId));

  const chatIds = userChats.map((c) => c.id);
  if (chatIds.length > 0) {
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(chat).where(inArray(chat.id, chatIds));
  }
}
