import { Client } from "@stomp/stompjs";
import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useRef } from "react";

import { chatRoomTopic } from "@/constants/chat-constants";
import { getAccessToken } from "@/storage/token";
import { useActiveChatStore } from "@/stores/use-active-chat-store";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/types/chat";
import { getWsBaseUrl } from "@/utils/get-ws-base-url";
import { decodeJwtPayload } from "@/utils/jwt";

export function useChatRoomsRealtime(
  roomIds: number[],
  onAnyMessage: () => void,
): void {
  const onAnyMessageRef = useRef(onAnyMessage);
  onAnyMessageRef.current = onAnyMessage;
  const accessToken = useAuthStore((s) => s.accessToken);

  const topicKey = useMemo(
    () => [...new Set(roomIds)].sort((a, b) => a - b).join(","),
    [roomIds],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!topicKey) return;

    let cancelled = false;
    const clientRef = { current: null as Client | null };
    const wsUrl = `${getWsBaseUrl()}/ws-native`;
    const ids = topicKey.split(",").map(Number).filter(Boolean);

    // Lấy userId hiện tại từ JWT để không tự thông báo tin nhắn của chính mình
    let myUserId: number | null = null;
    const currentToken = useAuthStore.getState().accessToken;
    if (currentToken) {
      const claims = decodeJwtPayload(currentToken);
      if (claims?.userId != null) {
        myUserId = Number(claims.userId);
      }
    }

    void (async () => {
      const token =
        accessToken ?? (await getAccessToken());
      if (!token || cancelled) return;

      const c = new Client({
        brokerURL: wsUrl,
        reconnectDelay: 5000,
        connectionTimeout: 10000,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        connectHeaders: { Authorization: `Bearer ${token}` },
        debug: () => undefined,
        onConnect: () => {
          ids.forEach((id) => {
            c.subscribe(chatRoomTopic(id), (frame) => {
              // Badge + danh sách phòng: debounce như cũ
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                onAnyMessageRef.current();
              }, 200);

              // 🔔 Gửi thông báo đẩy khi nhận tin nhắn từ người khác
              try {
                const msg = JSON.parse(frame.body) as ChatMessage;
                console.log("[ChatRealtime] Received msg:", { senderId: msg.senderId, myUserId, type: msg.type, chatRoomId: msg.chatRoomId });

                // Bỏ qua tin nhắn của chính mình
                if (myUserId != null && msg.senderId === myUserId) return;

                // Bỏ qua tin nhắn hệ thống
                if (msg.type === "SYSTEM" || msg.type === "JOIN" || msg.type === "LEAVE") return;

                // Smart mute: không thông báo nếu đang xem phòng chat này
                const activeChatRoomId = useActiveChatStore.getState().activeChatRoomId;
                if (activeChatRoomId != null && activeChatRoomId === msg.chatRoomId) return;

                console.log("[ChatRealtime] 🔔 Firing notification for msg:", msg.content);
                // Bắn notification
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: "💬 Tin nhắn mới",
                    body: msg.content || "Bạn có tin nhắn mới.",
                    data: { chatRoomId: msg.chatRoomId },
                    sound: true,
                  },
                  trigger: null,
                });
              } catch (e) {
                console.warn("[ChatRealtime] Notification error:", e);
              }
            });
          });
        },
      });

      if (cancelled) return;
      clientRef.current = c;
      c.activate();
    })();

    return () => {
      cancelled = true;
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [topicKey, accessToken]);
}
