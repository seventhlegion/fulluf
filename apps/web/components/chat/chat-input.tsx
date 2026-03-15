"use client";

import type { ReplyPreview } from "@/lib/api/types";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ImageIcon, SendIcon } from "lucide-react";
import { ReplyPreviewBar } from "./reply-preview-bar";

const FILE_ACCEPT =
  "image/*,video/*,audio/*,.pdf,.csv,.zip,.rar,application/pdf,text/csv,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  replyingTo: ReplyPreview | null;
  onCancelReply: () => void;
  onAttachClick: () => void;
  isSending: boolean;
  isConnected: boolean;
  isUploading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  replyingTo,
  onCancelReply,
  onAttachClick,
  isSending,
  isConnected,
  isUploading,
}: ChatInputProps) {
  const canSend = value.trim().length > 0 && !isSending && isConnected;

  return (
    <div className="fixed bottom-0 left-0 right-0 shrink-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-50">
      {replyingTo && (
        <ReplyPreviewBar replyTo={replyingTo} onCancel={onCancelReply} />
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onAttachClick}
          disabled={isUploading}
          aria-label="Attach media"
        >
          <ImageIcon className="size-4" />
        </Button>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          className="flex-1"
          disabled={isSending}
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export { FILE_ACCEPT };
