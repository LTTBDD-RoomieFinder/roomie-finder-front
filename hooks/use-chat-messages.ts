import { useCallback, useRef, useState } from "react";

import { chatService } from "@/services/chat-service";
import type { ChatMessage } from "@/types/chat";

const PAGE_SIZE = 20;

export type UseChatMessagesResult = {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Add a message or replace a matching optimistic one (same content + sender). */
  addMessage: (msg: ChatMessage) => void;
};

/**
 * Manages the message list for a chat room.
 * - Newest messages are at index 0 (to pair with FlatList inverted).
 * - Older messages are appended at the end when loadMore() is called.
 */
export function useChatMessages(chatRoomId: number): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextCursorRef = useRef<number | null>(null);
  const loadingMoreRef = useRef(false);

  const fetchInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await chatService.getMessages(chatRoomId, { size: PAGE_SIZE });
      setMessages(page.data ?? []);
      setHasMore(page.hasNext);
      nextCursorRef.current = page.nextCursor ?? null;
    } catch (err) {
      setError(typeof err === "string" ? err : "Không thể tải tin nhắn.");
    } finally {
      setIsLoading(false);
    }
  }, [chatRoomId]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || nextCursorRef.current == null) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await chatService.getMessages(chatRoomId, {
        cursor: nextCursorRef.current,
        size: PAGE_SIZE,
      });
      setMessages((prev) => [...prev, ...(page.data ?? [])]);
      setHasMore(page.hasNext);
      nextCursorRef.current = page.nextCursor ?? null;
    } catch {
      // silently ignore load-more errors
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [chatRoomId, hasMore]);

  const addMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      // Replace a matching optimistic message (negative temp ID, same content + sender)
      const optIdx = prev.findIndex(
        (m) => m.id < 0 && m.content === incoming.content && m.senderId === incoming.senderId,
      );
      if (optIdx >= 0) {
        const next = [...prev];
        next[optIdx] = incoming;
        return next;
      }
      // Replace message by real ID (realtime seenBy/status updates).
      const idx = prev.findIndex((m) => m.id === incoming.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = incoming;
        return next;
      }
      // Prepend newest message
      return [incoming, ...prev];
    });
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchInitial,
    loadMore,
    addMessage,
  };
}
