"use client";

import type { ReactionSummary } from "@/lib/api/types";

interface MessageReactionsProps {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
}

export function MessageReactions({ reactions, onToggle }: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-sm transition-colors ${
            r.userReacted
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted/50 hover:bg-muted"
          }`}
        >
          <span>{r.emoji}</span>
          {r.count > 1 && <span className="text-xs">{r.count}</span>}
        </button>
      ))}
    </div>
  );
}
