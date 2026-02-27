"use client";

import { Spoiler as SpoiledSpoiler } from "spoiled";

export function Spoiler({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: string;
  node?: unknown;
}) {
  return (
    <SpoiledSpoiler
      revealOn="click"
      theme="dark"
      defaultHidden={true}
    >
      {pending !== undefined ? "..." : children}
    </SpoiledSpoiler>
  );
}
