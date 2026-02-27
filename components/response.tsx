"use client";

import type { ComponentProps } from "react";
import { Streamdown, defaultRehypePlugins, type StreamdownProps } from "streamdown";
import { Spoiler } from "@/components/spoiler";
import rehypeSpoiler from "@/lib/rehype-spoiler";
import { cn } from "@/lib/utils";

type ResponseProps = ComponentProps<typeof Streamdown>;

const rehypePlugins = [...Object.values(defaultRehypePlugins), rehypeSpoiler];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = { spoiler: Spoiler } as any as StreamdownProps["components"];

export function Response({ className, children, ...props }: ResponseProps) {
  return (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      {...props}
      components={components}
      rehypePlugins={rehypePlugins}
    >
      {children}
    </Streamdown>
  );
}
