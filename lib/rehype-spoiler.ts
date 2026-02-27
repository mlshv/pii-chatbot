type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const spoilerRegex = /\|\|(.+?)\|\|/g;

export default function rehypeSpoiler() {
  return (tree: HastNode) => {
    walk(tree, false);
  };
}

function walk(node: HastNode, insideCode: boolean) {
  if (!node.children) return;

  const isCode = node.tagName === "code" || node.tagName === "pre";
  const skipTransform = insideCode || isCode;
  const newChildren: HastNode[] = [];
  let modified = false;

  for (const child of node.children) {
    if (
      child.type === "text" &&
      child.value?.includes("||") &&
      !skipTransform
    ) {
      const parts = splitSpoilers(child.value);
      if (parts.some((p) => p.type === "element")) {
        newChildren.push(...parts);
        modified = true;
        continue;
      }
    }
    walk(child, skipTransform);
    newChildren.push(child);
  }

  if (modified) {
    node.children = newChildren;
  }
}

function splitSpoilers(text: string): HastNode[] {
  const parts: HastNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(spoilerRegex)) {
    const matchIndex = match.index ?? 0;
    const before = text.slice(lastIndex, matchIndex);
    if (before) parts.push({ type: "text", value: before });
    parts.push({
      type: "element",
      tagName: "spoiler",
      properties: {},
      children: [{ type: "text", value: match[1] }],
    });
    lastIndex = matchIndex + match[0].length;
  }

  const after = text.slice(lastIndex);
  if (after) {
    const openIndex = after.lastIndexOf("||");
    const contentAfterOpen = openIndex !== -1 ? after.slice(openIndex + 2) : "";

    if (openIndex !== -1 && contentAfterOpen.length > 0) {
      const beforeOpen = after.slice(0, openIndex);
      if (beforeOpen) parts.push({ type: "text", value: beforeOpen });
      parts.push({
        type: "element",
        tagName: "spoiler",
        properties: { pending: "" },
        children: [{ type: "text", value: contentAfterOpen }],
      });
    } else {
      parts.push({ type: "text", value: after });
    }
  }

  return parts;
}
