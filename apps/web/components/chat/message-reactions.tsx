"use client";

import type { ReactionSummary } from "@/lib/api/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

interface MessageReactionsProps {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => void;
}

function getReactionTooltip(r: ReactionSummary): string {
  if (r.count === 1) {
    return r.userReacted ? "You reacted" : "1 person reacted";
  }
  if (r.userReacted) {
    const others = r.count - 1;
    return others === 1 ? "You and 1 other" : `You and ${others} others`;
  }
  return `${r.count} people reacted`;
}

export function MessageReactions({ reactions, onToggle }: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((r) => (
        <Tooltip key={r.emoji}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onToggle(r.emoji)}
              className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-sm transition-colors ${r.userReacted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/50 hover:bg-muted"
                }`}
            >
              <span>{r.emoji}</span>
              {r.count > 1 && <span className="text-xs">{r.count}</span>}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {getReactionTooltip(r)}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
