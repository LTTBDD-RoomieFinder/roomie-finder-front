import { chatApi } from "@/apis/chat-api";
import type {
  ChatMessage,
  ChatRoomDetails,
  ChatRoomItem,
  CursorPage,
} from "@/types/chat";
import { unwrapApiData } from "@/utils/unwrap-api-response";

export const chatService = {
  async getChatRooms(): Promise<ChatRoomItem[]> {
    const res = await chatApi.getChatRooms();
    return unwrapApiData<ChatRoomItem[]>(res);
  },

  async getChatRoomDetails(id: number): Promise<ChatRoomDetails> {
    const res = await chatApi.getChatRoomDetails(id);
    return unwrapApiData<ChatRoomDetails>(res);
  },

  async deleteChatRoom(id: number): Promise<void> {
    await chatApi.deleteChatRoom(id);
  },

  async getMessages(
    id: number,
    params?: { cursor?: number; size?: number },
  ): Promise<CursorPage<ChatMessage>> {
    const res = await chatApi.getMessages(id, params);
    return unwrapApiData<CursorPage<ChatMessage>>(res);
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
