import { useCallback, useEffect, useState } from "react";

import { useChatRoomsRealtime } from "@/hooks/use-chat-rooms-realtime";
import { chatService } from "@/services/chat-service";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { getAccessToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatRoomListRealtimeStore } from "@/stores/use-chat-room-list-realtime-store";
import { useNotificationStore } from "@/stores/use-notification-store";

/**
 * Subscribe STOMP theo từng phòng chat ngay sau khi đăng nhập (không cần mở tab Chats).
 * Cập nhật badge qua GET /me/tab-badges; đồng thời bump store để màn Chats refetch khi đang mở.
 * Khi có NEW_MESSAGE qua queue thông báo, refetch danh sách phòng để subscribe phòng mới (nếu có).
 */
export function useGlobalChatBadgeRealtime(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const messageSeq = useNotificationStore((s) => s.messageSeq);
  const [roomIds, setRoomIds] = useState<number[]>([]);

  const bumpRoomListMessage = useChatRoomListRealtimeStore(
    (s) => s.bumpRoomListMessage,
  );

  const loadRoomIds = useCallback(async () => {
    const token =
      useAuthStore.getState().accessToken ?? (await getAccessToken());
    if (!token) return;
    try {
      const rooms = await chatService.getChatRooms();
      setRoomIds((rooms ?? []).map((r) => r.id));
    } catch {
      // ignore — badge vẫn có thể cập nhật sau lần gọi khác
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setRoomIds([]);
      return;
    }
    void loadRoomIds();
  }, [isAuthenticated, accessToken, loadRoomIds]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (messageSeq === 0) return;
    void loadRoomIds();
  }, [messageSeq, isAuthenticated, loadRoomIds]);

  useChatRoomsRealtime(
    roomIds,
    useCallback(() => {
      void syncTabBadgesToStore();
      bumpRoomListMessage();
    }, [bumpRoomListMessage]),
  );
}
