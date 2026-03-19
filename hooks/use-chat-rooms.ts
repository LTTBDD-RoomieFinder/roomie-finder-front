import { useCallback, useState } from "react";

import { chatService } from "@/services/chat-service";
import type { ChatRoomItem } from "@/types/chat";

export type UseChatRoomsResult = {
  rooms: ChatRoomItem[];
  isLoading: boolean;
  error: string | null;
  refetch: (opts?: { silent?: boolean }) => Promise<void>;
};

export function useChatRooms(): UseChatRoomsResult {
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const data = await chatService.getChatRooms();
      setRooms(data ?? []);
    } catch (err) {
      if (!silent) {
        setError(
          typeof err === "string"
            ? err
            : "Không thể tải danh sách phòng chat.",
        );
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  return { rooms, isLoading, error, refetch };
}
