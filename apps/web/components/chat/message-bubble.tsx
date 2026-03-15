"use client";

import { UserAvatar } from "@/components/user-avatar";
import { useMediaBlobUrl } from "@/lib/api/queries";
import type { Message, ReplyPreview } from "@/lib/api/types";
import type { GetTokenFn } from "@/lib/helpers/http";
import { Button } from "@workspace/ui/components/button";
import { ReplyIcon, SmilePlusIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { EmojiPicker } from "./emoji-picker";
import { MessageContent } from "./message-content";
import { MessageReactions } from "./message-reactions";

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX = 80;

interface MessageBubbleProps {
  message: Message;
  getToken: GetTokenFn;
  socket: Socket | null;
  onReply: () => void;
}

export function MessageBubble({
  message,
  getToken,
  socket,
  onReply,
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setIsTransitioning(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const start = touchStartX.current;
    if (start == null) return;
    const touch = e.touches[0];
    if (!touch) return;
    let deltaX = touch.clientX - start;
    deltaX = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, deltaX));
    setSwipeOffset(deltaX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      if (start == null) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - start;
      setIsTransitioning(true);
      if (deltaX > SWIPE_THRESHOLD) {
        onReply();
      } else if (deltaX < -SWIPE_THRESHOLD) {
        setShowEmojiPicker(true);
      }
      setSwipeOffset(0);
    },
    [onReply]
  );

  const isMedia = message.type !== "text";
  const { data: blobUrl, isLoading } = useMediaBlobUrl(
    getToken,
    isMedia ? message.content : null
  );

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      if (!socket?.connected) return;
      socket.emit("reaction:toggle", { messageId: message.id, emoji });
      setShowEmojiPicker(false);
    },
    [socket, message.id]
  );

  const reactions = message.reactions ?? [];

  return (
    <div
      className="group flex gap-3 touch-pan-y overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <UserAvatar seed={message.senderHash} size="default" className="shrink-0" />
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg">
        <SwipeActionBackgrounds swipeOffset={swipeOffset} />
        <div
          className="relative z-10 bg-background"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isTransitioning ? "transform 0.25s ease-out" : "none",
          }}
        >
          <MessageHeader
            message={message}
            showEmojiPicker={showEmojiPicker}
            onEmojiPickerOpenChange={setShowEmojiPicker}
            onSelectEmoji={handleToggleReaction}
            onReply={onReply}
          />
          {message.replyTo && <ReplyPreviewBlock replyTo={message.replyTo} />}
          <MessageContent
            type={message.type}
            content={message.content}
            blobUrl={blobUrl ?? null}
            isLoading={isLoading}
          />
          <MessageReactions reactions={reactions} onToggle={handleToggleReaction} />
        </div>
      </div>
    </div>
  );
}

function SwipeActionBackgrounds({ swipeOffset }: { swipeOffset: number }) {
  return (
    <>
      <div
        className="absolute left-0 top-0 flex h-full w-16 items-center justify-center rounded-l-lg bg-primary/10 transition-opacity duration-200"
        style={{
          opacity: swipeOffset > 20 ? Math.min(1, (swipeOffset - 20) / 40) : 0,
        }}
      >
        <ReplyIcon className="size-5 text-primary" />
      </div>
      <div
        className="absolute right-0 top-0 flex h-full w-16 items-center justify-center rounded-r-lg bg-primary/10 transition-opacity duration-200"
        style={{
          opacity: swipeOffset < -20 ? Math.min(1, (-swipeOffset - 20) / 40) : 0,
        }}
      >
        <SmilePlusIcon className="size-5 text-primary" />
      </div>
    </>
  );
}

interface MessageHeaderProps {
  message: Message;
  showEmojiPicker: boolean;
  onEmojiPickerOpenChange: (open: boolean) => void;
  onSelectEmoji: (emoji: string) => void;
  onReply: () => void;
}

function MessageHeader({
  message,
  showEmojiPicker,
  onEmojiPickerOpenChange,
  onSelectEmoji,
  onReply,
}: MessageHeaderProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        {message.senderHash}
      </span>
      <span className="text-xs text-muted-foreground/70">
        {new Date(message.createdAt).toLocaleTimeString()}
      </span>
      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={onEmojiPickerOpenChange}
        onSelect={onSelectEmoji}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Add reaction"
          >
            <SmilePlusIcon className="size-4" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onReply}
        aria-label="Reply"
      >
        <ReplyIcon className="size-4" />
      </Button>
    </div>
  );
}

MessageHeader.displayName = "MessageHeader";

function ReplyPreviewBlock({ replyTo }: { replyTo: ReplyPreview }) {
  return (
    <div className="mt-1 rounded-md border-l-2 border-muted-foreground/30 bg-muted/30 px-2 py-1">
      <p className="text-xs font-medium text-muted-foreground">
        {replyTo.senderHash}
      </p>
      <p className="truncate text-sm text-foreground">
        {replyTo.type === "text" ? replyTo.content : `[${replyTo.type}]`}
      </p>
    </div>
  );
}
