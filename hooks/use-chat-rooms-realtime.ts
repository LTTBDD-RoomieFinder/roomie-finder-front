import { Client } from "@stomp/stompjs";
import { useEffect, useMemo, useRef } from "react";

import { chatRoomTopic } from "@/constants/chat-constants";
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
    let active = true;

    if (!topicKey) return;

    if (!accessToken) {
      return;
    }

    const wsUrl = `${getWsBaseUrl()}/ws-native`;
    const ids = topicKey.split(",").map(Number).filter(Boolean);

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      connectionTimeout: 10000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      debug: () => undefined,
      onConnect: () => {
        ids.forEach((id) => {
          client.subscribe(chatRoomTopic(id), (frame) => {
            // Không cần dùng msg trực tiếp: FE sẽ refresh từ API để sync unread/preview chuẩn.
            // Tránh JSON.parse mỗi khi có tin nhắn để giảm overhead.
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              onAnyMessageRef.current();
            }, 350);
          });
        });
      },
    });

    client.activate();

    return () => {
      active = false;
      client.deactivate();
    };
  }, [topicKey, accessToken]);
}

