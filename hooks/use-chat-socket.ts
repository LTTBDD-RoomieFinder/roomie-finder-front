import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { CHAT_SEND_DESTINATION, chatRoomTopic } from "@/constants/chat-constants";
import { useAuthStore } from "@/stores/useAuthStore";
import type { SendMessagePayload } from "@/data/request";
import type { ChatMessage } from "@/types/chat";
import { getWsBaseUrl } from "@/utils/get-ws-base-url";

export type UseChatSocketResult = {
  isConnected: boolean;
  sendMessage: (payload: SendMessagePayload) => void;
};

/**
 * Manages STOMP/WebSocket connection for a chat room.
 * Connects on mount, subscribes to /topic/chatroom.{id},
 * and auto-reconnects on disconnect.
 */
export function useChatSocket(
  chatRoomId: number,
  onMessage: (msg: ChatMessage) => void,
): UseChatSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let active = true;

    if (!accessToken) {
      console.warn("[ChatSocket] Skip connect: missing token", { chatRoomId });
      return;
    }

    const wsUrl = `${getWsBaseUrl()}/ws-native`;
    console.info("[ChatSocket] Connecting", {
      chatRoomId,
      endpoint: wsUrl,
    });

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      connectionTimeout: 10000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      debug: (msg) => console.debug("[ChatSocket][STOMP]", msg),
      onConnect: () => {
        if (!active) return;
        setIsConnected(true);
        client.subscribe(chatRoomTopic(chatRoomId), (frame) => {
          try {
            const msg = JSON.parse(frame.body) as ChatMessage;
            onMessageRef.current(msg);
          } catch (e) {
            console.error("[Chat] Failed to parse STOMP message", e);
          }
        });
      },

      onDisconnect: () => {
        console.warn("[ChatSocket] Disconnected", { chatRoomId });
        if (active) setIsConnected(false);
      },

      onStompError: (frame) => {
        console.error("[ChatSocket] STOMP error", {
          chatRoomId,
          message: frame.headers["message"],
          details: frame.body,
        });
      },

      onWebSocketError: (event) => {
        console.error("[ChatSocket] WebSocket error", {
          chatRoomId,
          event,
        });
      },

      onWebSocketClose: (event) => {
        console.warn("[ChatSocket] WebSocket closed", {
          chatRoomId,
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (active) setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      active = false;
      console.info("[ChatSocket] Deactivating client", { chatRoomId });
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [chatRoomId, accessToken]);

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: CHAT_SEND_DESTINATION,
        body: JSON.stringify(payload),
      });
    }
  }, []);

  return { isConnected, sendMessage };
}
