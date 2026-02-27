import { ANON_USER_ID } from "@/lib/auth";
import { deleteAllChatsByUserId, getChatsByUserId } from "@/lib/db/queries";

export async function GET() {
  const chats = await getChatsByUserId(ANON_USER_ID);
  return Response.json(chats);
}

export async function DELETE() {
  await deleteAllChatsByUserId(ANON_USER_ID);
  return Response.json({ success: true });
}
