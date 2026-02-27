import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
  type UIMessage,
} from "ai";
import {
  createChat,
  deleteChat,
  getChatById,
  getMessagesByChatId,
  saveMessages,
  updateChatTitle,
} from "@/lib/db/queries";
import { ANON_USER_ID } from "@/lib/auth";
import { generateUUID, getMostRecentUserMessage } from "@/lib/utils";
import {
  type ChatMessage,
  applyRedactions,
  detectPII,
} from "@/lib/pii";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const userId = ANON_USER_ID;

    const { id, messages }: { id: string; messages: UIMessage[] } =
      await request.json();

    const userMessage = getMostRecentUserMessage(messages);

    const existingChat = await getChatById(id);
    let isNewChat = false;

    if (!existingChat) {
      await createChat({ id, userId, title: "New chat" });
      isNewChat = true;
    }

    if (userMessage) {
      const existingMessages = await getMessagesByChatId(id);
      const alreadySaved = existingMessages.some(
        (m) => m.id === userMessage.id
      );

      if (!alreadySaved) {
        await saveMessages([
          {
            id: userMessage.id,
            chatId: id,
            role: "user",
            parts: userMessage.parts,
          },
        ]);
      }
    }

    const modelMessages = await convertToModelMessages(messages);

    let piiItems: string[] = [];

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        const result = streamText({
          model: openai("gpt-4.1"),
          system:
            "You are a helpful assistant. When the user shares personal information, acknowledge it naturally and repeat it back to confirm you received it correctly. Do not warn about privacy or refuse to handle PII.",
          messages: modelMessages,
        });

        // Text streams immediately
        writer.merge(result.toUIMessageStream());

        // PII detection — chunk at sentence boundaries, concurrent calls
        const pendingDetections: Promise<void>[] = [];
        let buffer = "";

        const flushChunk = (text: string) => {
          if (text.trim().length === 0) return;
          const detection = (async () => {
            try {
              const items = await detectPII(text);
              if (items.length === 0) return;
              for (const item of items) {
                if (!piiItems.includes(item)) {
                  piiItems.push(item);
                }
              }
              writer.write({
                type: "data-redaction",
                data: { items: piiItems },
              });
            } catch {}
          })();
          pendingDetections.push(detection);
        };

        for await (const chunk of result.textStream) {
          buffer += chunk;

          // Flush at sentence boundary (". ", "! ", "? ") or newline, when >=40 chars
          const boundaryMatch = buffer.match(/[.!?]\s|\n/);
          if (boundaryMatch && boundaryMatch.index !== undefined && buffer.length >= 40) {
            const splitAt = boundaryMatch.index + boundaryMatch[0].length;
            flushChunk(buffer.slice(0, splitAt));
            buffer = buffer.slice(splitAt);
          }
        }

        // Flush remaining
        flushChunk(buffer);

        await Promise.all(pendingDetections);

        // Generate title for new chats
        if (isNewChat && userMessage) {
          const userText = userMessage.parts
            .filter(
              (p): p is { type: "text"; text: string } => p.type === "text"
            )
            .map((p) => p.text)
            .join(" ");

          if (userText) {
            const { text: title } = await generateText({
              model: openai("gpt-4.1"),
              system:
                "Generate a short (3-6 word) title for this chat based on the user's first message. Return only the title, no quotes.",
              prompt: userText,
            });
            updateChatTitle(id, title.trim());
          }
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        console.log("[onFinish] piiItems:", piiItems);
        console.log("[onFinish] messages count:", finishedMessages.length);

        if (finishedMessages.length > 0) {
          const toSave = finishedMessages.map((m) => {
            const parts = m.parts
              .filter((part) => !part.type.startsWith("data-"))
              .map((part) => {
                if (part.type === "text" && piiItems.length > 0) {
                  const redacted = applyRedactions(part.text, piiItems);
                  console.log("[onFinish] redacted text:", redacted.slice(0, 200));
                  return { ...part, text: redacted };
                }
                return part;
              });
            return { id: m.id, chatId: id, role: m.role, parts };
          });

          await saveMessages(toSave);
        }
      },
      onError: (error) => {
        console.error("[chat/route] stream error:", error);
        return "An error occurred while generating a response.";
      },
    });

    return createUIMessageStreamResponse({
      stream,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  } catch (error) {
    console.error("[chat/route] POST error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing chat id" }, { status: 400 });
  }

  await deleteChat(id);
  return Response.json({ success: true });
}
