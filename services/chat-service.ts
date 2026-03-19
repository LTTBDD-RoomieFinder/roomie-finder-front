import { chatApi } from "@/apis/chat-api";
import type {
  ChatMessage,
  ChatRoomDetails,
  ChatRoomItem,
  CursorPage,
} from "@/types/chat";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const chatService = {
  async getChatRooms(): Promise<ChatRoomItem[]> {
    const res = await chatApi.getChatRooms();
    return unwrap<ChatRoomItem[]>(res);
  },

  async getChatRoomDetails(id: number): Promise<ChatRoomDetails> {
    const res = await chatApi.getChatRoomDetails(id);
    return unwrap<ChatRoomDetails>(res);
  },

  async deleteChatRoom(id: number): Promise<void> {
    await chatApi.deleteChatRoom(id);
  },

  async getMessages(
    id: number,
    params?: { cursor?: number; size?: number },
  ): Promise<CursorPage<ChatMessage>> {
    const res = await chatApi.getMessages(id, params);
    return unwrap<CursorPage<ChatMessage>>(res);
  },

  async markMessagesSeen(id: number): Promise<void> {
    await chatApi.markMessagesSeen(id);
  },

  async leaveChatRoom(id: number): Promise<void> {
    await chatApi.leaveChatRoom(id);
  },

  async kickChatRoomMember(id: number, memberUserId: number): Promise<void> {
    await chatApi.kickChatRoomMember(id, memberUserId);
  },
};
