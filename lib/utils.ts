import type { UIMessage, UIMessagePart } from "ai";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DBMessage } from "./db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function convertToUIMessages(messages: DBMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    parts: message.parts as UIMessagePart<Record<string, never>, Record<string, never>>[],
  }));
}

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === "user");
  return userMessages.at(-1);
}
