"use client";

import { LiveStatus } from "@/components/live-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import type { ConnectionStatus } from "@/lib/chat/connection-status";
import { Button } from "@workspace/ui/components/button";
import { LogOutIcon } from "lucide-react";
import Image from "next/image";

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
    <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex justify-center items-center gap-2">
        <Image
          src="/sheep.png"
          alt="Fulluf"
          width={32}
          height={32}
          className="shrink-0 rounded-full"
        />
        <h1 className="text-lg font-semibold">Fulluf</h1>
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
