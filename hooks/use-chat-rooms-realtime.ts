import { Client } from "@stomp/stompjs";
import { useEffect, useMemo, useRef } from "react";

import { chatRoomTopic } from "@/constants/chat-constants";
import { getAccessToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";
import { getWsBaseUrl } from "@/utils/get-ws-base-url";

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
              // Không cần dùng msg trực tiếp: FE sẽ refresh từ API để sync unread/preview chuẩn.
              // Tránh JSON.parse mỗi khi có tin nhắn để giảm overhead.
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                onAnyMessageRef.current();
              }, 200);
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

