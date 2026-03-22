import { useCallback, useRef, useState, useEffect } from "react";
import { chatService } from "@/services/chat-service";
import type { ChatMessage } from "@/types/chat";

const PAGE_SIZE = 10;

export type UseChatMessagesResult = {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
};

export function useChatMessages(chatRoomId: number): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setError(null);
    nextCursorRef.current = null;
    isFetchingRef.current = false;
  }, [chatRoomId]);

  const fetchInitial = useCallback(async () => {
    if (!chatRoomId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const page = await chatService.getMessages(chatRoomId, { size: PAGE_SIZE });
      const newMessages = page?.data || [];
      
      setMessages(newMessages);
      setHasMore(!!page?.hasNext);
      nextCursorRef.current = page?.nextCursor ?? null;
    } catch (err: any) {
      setError(err?.message || "Không thể tải tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [chatRoomId]);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || nextCursorRef.current === null) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const page = await chatService.getMessages(chatRoomId, {
        cursor: nextCursorRef.current,
        size: PAGE_SIZE,
      });

      const fetchedMessages = page?.data || [];

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNewMessages = fetchedMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...uniqueNewMessages];
      });

      setHasMore(!!page?.hasNext);
      nextCursorRef.current = page?.nextCursor ?? null;
    } catch {
      console.warn("Failed to load more messages");
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [chatRoomId, hasMore]);

  const addMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      const optimisticIdx = prev.findIndex(
        (m) => m.id < 0 && m.content === incoming.content && m.senderId === incoming.senderId
      );

      if (optimisticIdx !== -1) {
        const next = [...prev];
        next[optimisticIdx] = incoming;
        return next;
      }

      const existingIdx = prev.findIndex((m) => m.id === incoming.id);
      
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = incoming;
        return next;
      }

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