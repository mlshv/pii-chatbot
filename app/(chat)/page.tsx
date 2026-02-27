import { Chat } from "@/components/chat";
import { generateUUID } from "@/lib/utils";

export default function NewChatPage() {
  const id = generateUUID();

  return <Chat id={id} initialMessages={[]} />;
}
