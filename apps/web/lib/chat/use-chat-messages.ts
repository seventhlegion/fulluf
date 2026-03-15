"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import type { GetTokenFn } from "@/lib/helpers/http";
import { createChatRequests } from "@/lib/api/requests";
import type { Message } from "@/lib/api/types";

export const CHAT_KEYS = {
  all: ["chat"] as const,
  messages: () => [...CHAT_KEYS.all, "messages"] as const,
};

const MESSAGES_PAGE_SIZE = 30;

type PageParam = { before?: string; after?: string } | undefined;

export function useChatMessages(
  getToken: GetTokenFn,
  socket: Socket | null,
  currentUserHash?: string,
  enabled = true
) {
  const queryClient = useQueryClient();
  const chatRequests = useMemo(
    () => createChatRequests(getToken),
    [getToken]
  );

  const query = useInfiniteQuery({
    queryKey: CHAT_KEYS.messages(),
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      const params = pageParam ?? {};
      return chatRequests.fetchMessages({
        limit: MESSAGES_PAGE_SIZE,
        before: params.before,
        after: params.after,
      });
    },
    initialPageParam: undefined as PageParam,
    getNextPageParam: (lastPage): PageParam => {
      if (lastPage.length < MESSAGES_PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return last ? { after: last.id } : undefined;
    },
    getPreviousPageParam: (firstPage): PageParam => {
      if (firstPage.length < MESSAGES_PAGE_SIZE) return undefined;
      const first = firstPage[0];
      return first ? { before: first.id } : undefined;
    },
    enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const appendNewMessage = useCallback(
    (msg: Message) => {
      queryClient.setQueryData(
        CHAT_KEYS.messages(),
        (old: { pages: Message[][]; pageParams: PageParam[] } | undefined) => {
          if (!old) return { pages: [[msg]], pageParams: [undefined] };
          const lastPage = old.pages[old.pages.length - 1];
          if (!lastPage) return { ...old, pages: [...old.pages, [msg]] };
          const lastMsg = lastPage[lastPage.length - 1];
          if (lastMsg?.id === msg.id) return old;
          const newLastPage = [...lastPage, msg];
          return {
            ...old,
            pages: [...old.pages.slice(0, -1), newLastPage],
          };
        }
      );
    },
    [queryClient]
  );

  const updateMessageReactions = useCallback(
    (messageId: string, reactions: { emoji: string; count: number; senders: string[] }[]) => {
      const reactionsWithUser: Message["reactions"] = reactions.map((r) => ({
        emoji: r.emoji,
        count: r.count,
        userReacted: !!(currentUserHash && r.senders.includes(currentUserHash)),
      }));
      queryClient.setQueryData(
        CHAT_KEYS.messages(),
        (old: { pages: Message[][]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) =>
                msg.id === messageId ? { ...msg, reactions: reactionsWithUser } : msg
              )
            ),
          };
        }
      );
    },
    [queryClient, currentUserHash]
  );

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (msg: Message) => appendNewMessage(msg);
    socket.on("message:new", onNewMessage);
    return () => {
      socket.off("message:new", onNewMessage);
    };
  }, [socket, appendNewMessage]);

  useEffect(() => {
    if (!socket) return;
    const onReactionUpdated = (payload: {
      messageId: string;
      reactions: { emoji: string; count: number; senders: string[] }[];
    }) => updateMessageReactions(payload.messageId, payload.reactions);
    socket.on("reaction:updated", onReactionUpdated);
    return () => {
      socket.off("reaction:updated", onReactionUpdated);
    };
  }, [socket, updateMessageReactions]);

  return { ...query, appendNewMessage };
}
