"use client";

import type { ConnectionStatus } from "@/lib/chat/connection-status";
import { Badge } from "@workspace/ui/components/badge";

interface LiveStatusProps {
  status: ConnectionStatus;
  className?: string;
}

export function LiveStatus({ status, className }: LiveStatusProps) {
  const config = {
    connected: {
      label: "Live",
      title: "Connected",
      dotClass: "bg-emerald-500 animate-pulse",
      badgeClass:
        "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    },
    connecting: {
      label: "Connecting…",
      title: "Connecting to chat…",
      dotClass: "bg-amber-500 animate-pulse",
      badgeClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    },
    disconnected: {
      label: "Offline",
      title: "Disconnected",
      dotClass: "bg-amber-500",
      badgeClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    },
  };

  const { label, title, dotClass, badgeClass } = config[status];

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass} ${className ?? ""}`}
      title={title}
    >
      <div className={`size-1.5 rounded-full ${dotClass}`} />
      {label}
    </Badge>
  );
}
