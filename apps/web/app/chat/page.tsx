"use client";

import {
  ChatHeader,
  ChatInput,
  ChatMessageList,
  FILE_ACCEPT,
  ScrollToBottomButton,
} from "@/components/chat";
import { useCreateMediaMessageMutation } from "@/lib/api/queries";
import { useChatMessages } from "@/lib/chat/use-chat-messages";
import { useChatScroll } from "@/lib/chat/use-chat-scroll";
import { useChatSend } from "@/lib/chat/use-chat-send";
import { useChatSocket } from "@/lib/chat/use-chat-socket";
import { useAuth } from "@/lib/context/auth-context";
import { Spinner } from "@workspace/ui/components/spinner";
import { useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";

export default function ChatPage() {
  const router = useRouter();
  const { getToken, username, clearAuth, ready, isAuthenticated } = useAuth();
  const { socket, isConnected, connectionStatus } = useChatSocket(getToken);
  const createMedia = useCreateMediaMessageMutation(getToken);

  const {
    data,
    fetchPreviousPage,
    fetchNextPage,
    hasPreviousPage,
    hasNextPage,
    isFetchingPreviousPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useChatMessages(getToken, socket, username ?? undefined, isAuthenticated);

  const messages = useMemo(() => {
    const flat = data?.pages.flat() ?? [];
    const seen = new Set<string>();
    return flat.filter((msg) => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [data?.pages]);

  const isInitialLoad = (data?.pages.length ?? 0) <= 1;

  const {
    messagesEndRef,
    messagesScrollRef,
    loadMoreTopRef,
    handleScroll,
    scrollToBottom,
    showScrollToBottom,
  } = useChatScroll({
    messagesLength: messages.length,
    isInitialLoad,
    hasPreviousPage,
    hasNextPage,
    isFetchingPreviousPage,
    isFetchingNextPage,
    fetchPreviousPage,
    fetchNextPage,
  });

  const {
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
    isUploading,
  } = useChatSend({
    socket,
    createMedia,
    scrollToBottom,
  });

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, router]);

  function handleLogout() {
    clearAuth();
    router.replace("/");
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ChatHeader
        username={username ?? ""}
        connectionStatus={connectionStatus}
        onLogout={handleLogout}
      />

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden mb-16">
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          getToken={getToken}
          socket={socket}
          onReply={setReplyTo}
          messagesEndRef={messagesEndRef}
          messagesScrollRef={messagesScrollRef}
          loadMoreTopRef={loadMoreTopRef}
          onScroll={handleScroll}
          isFetchingPreviousPage={isFetchingPreviousPage}
          isFetchingNextPage={isFetchingNextPage}
        />

        {showScrollToBottom && (
          <ScrollToBottomButton onClick={scrollToBottom} />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
        <ChatInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyTo(null)}
          onAttachClick={triggerFileInput}
          isSending={isSending}
          isConnected={isConnected}
          isUploading={isUploading}
        />
      </main>
    </div>
  );
}
