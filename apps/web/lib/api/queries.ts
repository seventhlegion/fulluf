"use client";

import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { GetTokenFn } from "@/lib/helpers/http";
import { login, createChatRequests } from "./requests";
import type { LoginRequest, Message } from "./types";

const AUTH_KEYS = {
  all: ["auth"] as const,
};

const CHAT_KEYS = {
  all: ["chat"] as const,
};

export function useLoginMutation(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof login>>,
    Error,
    LoginRequest
  >
) {
  return useMutation({
    mutationFn: login,
    ...options,
  });
}

export function useCreateMediaMessageMutation(
  getToken: GetTokenFn,
  options?: UseMutationOptions<
    Awaited<ReturnType<ReturnType<typeof createChatRequests>["createMediaMessage"]>>,
    Error,
    FormData
  >
) {
  const queryClient = useQueryClient();
  const chat = createChatRequests(getToken);

  return useMutation({
    mutationFn: chat.createMediaMessage,
    ...options,
  });
}

export function useMediaBlobQuery(
  getToken: GetTokenFn,
  filename: string | null,
  options?: Omit<
    UseQueryOptions<string, Error, string>,
    "queryKey" | "queryFn"
  >
) {
  const chat = createChatRequests(getToken);

  return useQuery({
    queryKey: [...CHAT_KEYS.all, "media", filename] as const,
    queryFn: () => chat.fetchMediaBlob(filename!),
    enabled: !!filename && !!getToken(),
    staleTime: 5 * 60 * 1000, // 5 min - media doesn't change often
    ...options,
  });
}

/** Hook that fetches media and returns blob URL, revoking it on unmount */
export function useMediaBlobUrl(
  getToken: GetTokenFn,
  filename: string | null,
  options?: Omit<
    UseQueryOptions<string, Error, string>,
    "queryKey" | "queryFn"
  >
) {
  const query = useMediaBlobQuery(getToken, filename, options);

  useEffect(() => {
    const url = query.data;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [query.data]);

  return query;
}

export { CHAT_KEYS, AUTH_KEYS };
