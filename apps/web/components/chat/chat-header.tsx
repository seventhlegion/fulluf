"use client";

import { LiveStatus } from "@/components/live-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import type { ConnectionStatus } from "@/lib/chat/connection-status";
import { Button } from "@workspace/ui/components/button";
import { LogOutIcon } from "lucide-react";

interface ChatHeaderProps {
  username: string;
  connectionStatus: ConnectionStatus;
  onLogout: () => void;
}

export function ChatHeader({
  username,
  connectionStatus,
  onLogout,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-center items-center gap-2">
        <img
          src="/sheep.png"
          alt=""
          className="size-8 shrink-0 rounded-full object-contain"
        />
        <h1 className="text-lg font-semibold">FulluF</h1>
        <LiveStatus status={connectionStatus} />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserAvatar seed={username} size="default" />
        <span className="text-sm text-muted-foreground">{username}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOutIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
