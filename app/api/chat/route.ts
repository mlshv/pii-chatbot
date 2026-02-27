import { cerebras } from "@ai-sdk/cerebras";
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

export const maxDuration = 60;

export async function POST(request: Request) {
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

  // Save user message to DB if it's new
  if (userMessage) {
    const existingMessages = await getMessagesByChatId(id);
    const alreadySaved = existingMessages.some((m) => m.id === userMessage.id);

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

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: cerebras("zai-glm-4.7"),
        system:
          "You are a helpful assistant.",
        messages: modelMessages,
      });

      writer.merge(result.toUIMessageStream());

      // Generate title for new chats
      if (isNewChat && userMessage) {
        const userText = userMessage.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");

        if (userText) {
          const { text: title } = await generateText({
            model: cerebras("zai-glm-4.7"),
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
      if (finishedMessages.length > 0) {
        await saveMessages(
          finishedMessages.map((m) => ({
            id: m.id,
            chatId: id,
            role: m.role,
            parts: m.parts,
          }))
        );
      }
    },
    onError: () => "An error occurred while generating a response.",
  });

  return createUIMessageStreamResponse({ stream });
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
