import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chat = await getChatById(id);

  if (!chat) {
    redirect("/");
  }

  const messagesFromDb = await getMessagesByChatId(id);
  const uiMessages = convertToUIMessages(messagesFromDb);

  return <Chat id={chat.id} initialMessages={uiMessages} />;
}
