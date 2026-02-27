import { openai } from "@ai-sdk/openai";
import { generateText, type UIMessage } from "ai";

// --- Types ---

export type ChatDataTypes = {
  redaction: { items: string[] };
};

export type ChatMessage = UIMessage<unknown, ChatDataTypes>;

// --- Detection ---

export async function detectPII(text: string): Promise<string[]> {
  try {
    console.log("[PII] detecting in %d chars: %s", text.length, text.slice(0, 80));
    const start = Date.now();

    const { text: response } = await generateText({
      model: openai("gpt-4.1-mini"),
      system: `You are a PII detector. Given text, find all personally identifiable information (emails, phones, SSNs, names, addresses, credit cards, IPs, dates of birth, etc).
Return a JSON array of the exact PII substrings found in the text.
If no PII found, return [].
Return ONLY the JSON array, no explanation.`,
      prompt: text,
    });

    console.log("[PII] LLM responded in %dms: %s", Date.now() - start, response.slice(0, 200));

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    const items = parsed.filter(
      (item): item is string =>
        typeof item === "string" && text.includes(item)
    );

    console.log("[PII] found %d items: %s", items.length, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error("[PII] error:", error);
    return [];
  }
}

// --- Apply redactions ---

export function applyRedactions(text: string, items: string[]): string {
  let result = text;
  // Sort longest first so "john@example.com" is replaced before "john"
  const sorted = [...items].sort((a, b) => b.length - a.length);
  for (const item of sorted) {
    // Only replace instances not already wrapped in ||
    const escaped = item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(
      new RegExp(`(?<!\\|\\|)${escaped}(?!\\|\\|)`, "g"),
      `||${item}||`
    );
  }
  return result;
}
