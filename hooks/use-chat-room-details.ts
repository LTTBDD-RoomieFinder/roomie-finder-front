import { useCallback, useEffect, useState } from "react";

import { chatService } from "@/services/chat-service";
import type { ChatRoomDetails } from "@/types/chat";

export type UseChatRoomDetailsResult = {
  details: ChatRoomDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useChatRoomDetails(chatRoomId: number): UseChatRoomDetailsResult {
  const [details, setDetails] = useState<ChatRoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatService.getChatRoomDetails(chatRoomId);
      setDetails(data ?? null);
    } catch (err) {
      setError(typeof err === "string" ? err : "Không thể tải thông tin phòng chat.");
      setDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [chatRoomId]);

  useEffect(() => {
    if (!Number.isFinite(chatRoomId) || chatRoomId <= 0) return;
    refetch();
  }, [chatRoomId, refetch]);

  return { details, isLoading, error, refetch };
}

