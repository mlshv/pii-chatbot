"use client";

import { useState } from "react";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { Sidebar } from "@/components/sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="relative flex-1">
        {/* Mobile hamburger */}
        <button
          className="absolute left-3 top-3 z-30 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
          onClick={() => setSidebarOpen(true)}
          type="button"
        >
          <SidebarSimpleIcon size={20} />
        </button>

        {children}
      </div>
    </div>
  );
}
