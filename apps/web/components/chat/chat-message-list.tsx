"use client";

import type { Message, ReplyPreview } from "@/lib/api/types";
import type { GetTokenFn } from "@/lib/helpers/http";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import type { Socket } from "socket.io-client";
import { MessageBubble } from "./message-bubble";
import { MessageListSkeleton } from "./message-list-skeleton";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  getToken: GetTokenFn;
  socket: Socket | null;
  onReply: (reply: ReplyPreview) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesScrollRef: React.RefObject<HTMLDivElement | null>;
  loadMoreTopRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  isFetchingPreviousPage: boolean;
  isFetchingNextPage: boolean;
}

export function ChatMessageList({
  messages,
  isLoading,
  isError,
  error,
  onRetry,
  getToken,
  socket,
  onReply,
  messagesEndRef,
  messagesScrollRef,
  loadMoreTopRef,
  onScroll,
  isFetchingPreviousPage,
  isFetchingNextPage,
}: ChatMessageListProps) {
  return (
    <div
      ref={messagesScrollRef}
      className="scrollbar-elegant min-h-0 flex-1 overflow-y-auto p-4"
      onScroll={onScroll}
    >
      <div ref={loadMoreTopRef} className="h-1 shrink-0" aria-hidden />
      {isFetchingPreviousPage && (
        <div className="flex justify-center py-2">
          <Spinner className="size-6" />
        </div>
      )}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <MessageListSkeleton />
        ) : isError ? (
          <ErrorMessageState error={error} onRetry={onRetry} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                getToken={getToken}
                socket={socket}
                onReply={() =>
                  onReply({
                    id: msg.id,
                    type: msg.type,
                    content: msg.type === "text" ? msg.content : "",
                    senderHash: msg.senderHash,
                  })
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Spinner className="size-6" />
        </div>
      )}
    </div>
  );
}

function ErrorMessageState({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
      <p className="text-sm font-medium text-destructive">
        Failed to load messages
      </p>
      <p className="text-xs text-muted-foreground">
        {error instanceof Error ? error.message : "Unknown error"}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
