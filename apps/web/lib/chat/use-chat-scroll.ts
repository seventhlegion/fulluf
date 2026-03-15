"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseChatScrollOptions {
  messagesLength: number;
  isInitialLoad: boolean;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isFetchingPreviousPage: boolean;
  isFetchingNextPage: boolean;
  fetchPreviousPage: () => void;
  fetchNextPage: () => void;
}

export function useChatScroll({
  messagesLength,
  isInitialLoad,
  hasPreviousPage,
  hasNextPage,
  isFetchingPreviousPage,
  isFetchingNextPage,
  fetchPreviousPage,
  fetchNextPage,
}: UseChatScrollOptions) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreTopRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeFetch = useRef<number>(0);
  const lastScrollTop = useRef<number>(0);
  const lastScrollDirection = useRef<"up" | "down" | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isInitialLoad || messagesLength === 0) return;
    const el = messagesScrollRef.current;
    if (!el) return;

    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };

    scrollToBottom();
    const raf = requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    });
    const t = setTimeout(scrollToBottom, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [messagesLength, isInitialLoad]);

  // Preserve scroll position when prepending older messages
  useEffect(() => {
    if (!isFetchingPreviousPage && scrollHeightBeforeFetch.current > 0) {
      const el = messagesScrollRef.current;
      if (el) {
        const prevHeight = scrollHeightBeforeFetch.current;
        scrollHeightBeforeFetch.current = 0;
        requestAnimationFrame(() => {
          const delta = el.scrollHeight - prevHeight;
          if (delta > 0) {
            el.scrollTop += delta;
          }
        });
      }
    }
  }, [isFetchingPreviousPage, messagesLength]);

  // IntersectionObserver: load older messages when top sentinel becomes visible
  const loadPrevious = useCallback(() => {
    if (hasPreviousPage && !isFetchingPreviousPage) {
      scrollHeightBeforeFetch.current =
        messagesScrollRef.current?.scrollHeight ?? 0;
      void fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  useEffect(() => {
    const sentinel = loadMoreTopRef.current;
    const root = messagesScrollRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadPrevious();
        }
      },
      { root, rootMargin: "100px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPrevious]);

  const handleScroll = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    const prevTop = lastScrollTop.current;
    lastScrollTop.current = scrollTop;

    if (scrollTop < prevTop) lastScrollDirection.current = "up";
    else if (scrollTop > prevTop) lastScrollDirection.current = "down";

    const atTop = scrollTop < 50;
    const scrolledUp = lastScrollDirection.current === "up";
    setShowScrollToBottom(!isNearBottom && (atTop || scrolledUp));

    if (
      scrollHeight - scrollTop - clientHeight < 100 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return {
    messagesEndRef,
    messagesScrollRef,
    loadMoreTopRef,
    handleScroll,
    scrollToBottom,
    showScrollToBottom,
  };
}
