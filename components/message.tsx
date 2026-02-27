"use client";

import { Response } from "@/components/response";
import { cn } from "@/lib/utils";
import { applyRedactions, type ChatMessage } from "@/lib/pii";

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  // Collect PII items from data-redaction parts (only present during streaming)
  const piiItems: string[] = [];
  const partTypes = message.parts.map((p) => p.type);
  console.log("[Message] id=%s role=%s parts=%s", message.id, message.role, JSON.stringify(partTypes));

  for (const part of message.parts) {
    if (part.type === "data-redaction") {
      console.log("[Message] found data-redaction part:", part.data);
      piiItems.push(...part.data.items);
    }
  }

  if (piiItems.length > 0) {
    console.log("[Message] piiItems:", piiItems);
  }

  function getDisplayText(originalText: string): string {
    if (piiItems.length === 0) return originalText;
    const redacted = applyRedactions(originalText, piiItems);
    console.log("[Message] redacted text:", redacted);
    return redacted;
  }

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
            const displayText = getDisplayText(part.text);
            // Change key when redactions arrive to force Streamdown re-mount
            const key = piiItems.length > 0 ? `${i}-redacted` : i;
            if (isUser) {
              return (
                <p key={key} className="whitespace-pre-wrap text-sm">
                  {displayText}
                </p>
              );
            }
            return <Response key={key}>{displayText}</Response>;
          }
          return null;
        })}
      </div>
    </div>
  );
}
