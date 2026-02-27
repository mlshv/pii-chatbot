"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, StopIcon } from "@phosphor-icons/react";
import { Message } from "@/components/message";
import { generateUUID } from "@/lib/utils";
import type { ChatMessage } from "@/lib/pii";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const hasRedirected = useRef(false);

  const { messages, sendMessage, status, stop } = useChat<ChatMessage>({
    id,
    messages: initialMessages as ChatMessage[],
    generateId: generateUUID,
    onFinish: () => {
      // Push URL on first message for new chats (created from /)
      if (!hasRedirected.current && window.location.pathname === "/") {
        hasRedirected.current = true;
        window.history.replaceState(null, "", `/chat/${id}`);
      }
      router.refresh();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Scroll to bottom only when user sends a message, not during streaming
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    // Only scroll when a new user message is added (count jumps by 1 with role=user)
    if (newCount > prevCount) {
      const lastMsg = messages[newCount - 1];
      if (lastMsg?.role === "user") {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                PII Chatbot
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Ask me anything. I will redact sensitive information!
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl py-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500">
                <span className="inline-block size-2 animate-pulse rounded-full bg-zinc-500" />
                <span>
                  {status === "submitted" ? "Thinking..." : "Generating..."}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="pb-6 px-2">
        <form
          onSubmit={handleSubmit}
          className="relative mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white focus-within:border-zinc-900"
        >
          <textarea
            className="min-h-[100px] w-full resize-none bg-transparent px-4 pt-3 pb-14 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            placeholder="Type a message..."
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.closest("form");
                if (form) form.requestSubmit();
              }
            }}
          />
          <div className="absolute right-3 bottom-3">
            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white"
              >
                <StopIcon size={16} weight="bold" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white transition-opacity disabled:opacity-30"
              >
                <ArrowUpIcon size={16} weight="bold" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
