"use client";

import type { ReplyPreview } from "@/lib/api/types";
import { Button } from "@workspace/ui/components/button";
import { XIcon } from "lucide-react";

interface ReplyPreviewBarProps {
  replyTo: ReplyPreview;
  onCancel: () => void;
}

export function ReplyPreviewBar({ replyTo, onCancel }: ReplyPreviewBarProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">
          Replying to {replyTo.senderHash}
        </p>
        <p className="truncate text-sm text-foreground">
          {replyTo.type === "text" ? replyTo.content : `[${replyTo.type}]`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        aria-label="Cancel reply"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}
