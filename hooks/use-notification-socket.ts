import { Client } from "@stomp/stompjs";
import { useEffect, useRef } from "react";

import { NOTIFICATION_QUEUE_DESTINATION } from "@/constants/notification-constants";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { getAccessToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";
import type { NotificationItem } from "@/types/notification";
import { getWsBaseUrl } from "@/utils/get-ws-base-url";
import { parseNotificationFromStompBody } from "@/utils/notification-helpers";

export function useNotificationSocket(
  onNotification?: (notification: NotificationItem) => void,
): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;
    const clientRef = { current: null as Client | null };
    const connectResyncTimers: ReturnType<typeof setTimeout>[] = [];

    void (async () => {
      const token = accessToken ?? (await getAccessToken());
      if (!token || cancelled) return;

      const c = new Client({
        brokerURL: `${getWsBaseUrl()}/ws-native`,
        reconnectDelay: 5000,
        connectionTimeout: 10000,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        connectHeaders: { Authorization: `Bearer ${token}` },
        debug: () => undefined,
        onConnect: () => {
          if (cancelled) return;
          connectResyncTimers.forEach(clearTimeout);
          connectResyncTimers.length = 0;
          c.subscribe(NOTIFICATION_QUEUE_DESTINATION, (frame) => {
            try {
              const raw = JSON.parse(frame.body) as Record<string, unknown>;
              const payload = parseNotificationFromStompBody(raw);
              onNotificationRef.current?.(payload);
            } catch (error) {
              console.error("[NotificationSocket] Failed to parse payload", error);
            }
          });
          // Bắt kịp badge nếu tin WS tới trước SUBSCRIBE hoặc client không nhận được frame.
          void syncTabBadgesToStore();
          connectResyncTimers.push(
            setTimeout(() => {
              if (!cancelled) void syncTabBadgesToStore();
            }, 500),
            setTimeout(() => {
              if (!cancelled) void syncTabBadgesToStore();
            }, 1500),
          );
        },
        onStompError: (frame) => {
          console.error("[NotificationSocket] STOMP error", frame.headers["message"]);
        },
        onWebSocketError: () => {
          console.error("[NotificationSocket] Websocket transport error");
        },
      });

      if (cancelled) return;
      clientRef.current = c;
      c.activate();
    })();

    return () => {
      cancelled = true;
      connectResyncTimers.forEach(clearTimeout);
      connectResyncTimers.length = 0;
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, accessToken]);
}
