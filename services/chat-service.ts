import { chatApi } from "@/apis/chat-api";
import type {
  ChatMessage,
  ChatRoomDetails,
  ChatRoomItem,
  CursorPage,
} from "@/types/chat";
import { normalizeUserFromApi } from "@/utils/normalize-user";
import { unwrapApiData } from "@/utils/unwrap-api-response";

function normalizeChatRoomDetailsFromApi(data: ChatRoomDetails): ChatRoomDetails {
  const any = data as unknown as Record<string, unknown>;
  const ownerFromSnake = any.owner_id;
  const postFromSnake = any.post_title;
  return {
    ...data,
    ownerId:
      data.ownerId != null
        ? data.ownerId
        : ownerFromSnake != null && !Number.isNaN(Number(ownerFromSnake))
          ? Number(ownerFromSnake)
          : data.ownerId,
    postTitle:
      data.postTitle != null && data.postTitle !== ""
        ? data.postTitle
        : typeof postFromSnake === "string"
          ? postFromSnake
          : data.postTitle,
    members: (data.members ?? []).map((m) => normalizeUserFromApi(m)),
  };
}

export const chatService = {
  async getChatRooms(): Promise<ChatRoomItem[]> {
    const res = await chatApi.getChatRooms();
    return unwrapApiData<ChatRoomItem[]>(res);
  },

  async getChatRoomDetails(id: number): Promise<ChatRoomDetails> {
    const res = await chatApi.getChatRoomDetails(id);
    const data = unwrapApiData<ChatRoomDetails>(res);
    return normalizeChatRoomDetailsFromApi(data);
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
