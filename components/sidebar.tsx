"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChatCircleIcon,
  PlusIcon,
  SidebarSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { Chat } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function Sidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [chats, setChats] = useState<Chat[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then(setChats)
      .catch(() => {});
  }, [pathname]);

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/chat?id=${chatId}`, { method: "DELETE" });
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (pathname === `/chat/${chatId}`) {
      router.push("/");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onToggle}
          type="button"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-zinc-200 bg-zinc-50 transition-transform dark:border-zinc-800 dark:bg-zinc-950",
          "md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-800">
          <span className="font-semibold text-sm">PII Chatbot</span>
          <div className="flex gap-1">
            <Link
              href="/"
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              onClick={() => {
                if (window.innerWidth < 768) onToggle();
              }}
            >
              <PlusIcon size={18} />
            </Link>
            <button
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
              onClick={onToggle}
              type="button"
            >
              <SidebarSimpleIcon size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {chats.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-zinc-400">
              No chats yet
            </p>
          )}
          {chats.map((c) => {
            const isActive = pathname === `/chat/${c.id}`;
            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  isActive
                    ? "bg-zinc-200 dark:bg-zinc-800"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) onToggle();
                }}
              >
                <ChatCircleIcon size={16} className="shrink-0 text-zinc-400" />
                <span className="flex-1 truncate">{c.title}</span>
                <button
                  className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
                  onClick={(e) => handleDelete(e, c.id)}
                  type="button"
                >
                  <TrashIcon size={14} />
                </button>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
