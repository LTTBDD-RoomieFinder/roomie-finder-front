/** Websocket/STOMP destinations for chat features. */

/** STOMP destination for sending chat messages (server @MessageMapping /chat.send). */
export const CHAT_SEND_DESTINATION = "/app/chat.send";

/** STOMP topic prefix for chatroom messages: /topic/chatroom.{id}. */
export function chatRoomTopic(chatRoomId: number): string {
  return `/topic/chatroom.${chatRoomId}`;
}

