"use client";

import type { UIMessage } from "ai";
import { Response } from "@/components/response";
import { cn } from "@/lib/utils";

export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%]",
          isUser
            ? "rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-white"
            : "prose prose-sm dark:prose-invert max-w-none"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            if (isUser) {
              return (
                <p key={i} className="whitespace-pre-wrap text-sm">
                  {part.text}
                </p>
              );
            }
            return <Response key={i}>{part.text}</Response>;
          }
          return null;
        })}
      </div>
    </div>
  );
}
