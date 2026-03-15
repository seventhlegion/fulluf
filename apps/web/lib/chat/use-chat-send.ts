"use client";

import { useCallback, useRef, useState } from "react";
import type { ReplyPreview } from "@/lib/api/types";
import type { Socket } from "socket.io-client";

interface UseChatSendOptions {
  socket: Socket | null;
  createMedia: {
    mutate: (
      formData: FormData,
      options?: { onSuccess?: () => void }
    ) => void;
    isPending: boolean;
  };
  scrollToBottom: () => void;
}

export function useChatSend({
  socket,
  createMedia,
  scrollToBottom,
}: UseChatSendOptions) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !socket?.connected || isSending) return;

    setIsSending(true);
    socket.emit(
      "message:send",
      {
        type: "text",
        content: trimmed,
        replyToId: replyingTo?.id,
      },
      () => {
        setText("");
        setReplyingTo(null);
        setIsSending(false);
        requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
      }
    );
  }, [text, replyingTo, socket, isSending, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : "file";
      formData.append("type", type);
      if (replyingTo?.id) {
        formData.append("replyToId", replyingTo.id);
      }
      createMedia.mutate(formData, {
        onSuccess: () => {
          setReplyingTo(null);
          requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
        },
      });
      e.target.value = "";
    },
    [replyingTo, createMedia, scrollToBottom]
  );

  const setReplyTo = useCallback((reply: ReplyPreview | null) => {
    setReplyingTo(reply);
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    text,
    setText,
    replyingTo,
    setReplyTo,
    isSending,
    handleSend,
    handleKeyDown,
    handleFileChange,
    fileInputRef,
    triggerFileInput,
    isUploading: createMedia.isPending,
  };
}
