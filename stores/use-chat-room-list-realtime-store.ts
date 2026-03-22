import { create } from "zustand";

/**
 * Tăng khi có tin nhắn qua WebSocket topic phòng (đăng ký ở root layout).
 * Màn Chats subscribe để refetch danh sách mà không cần hook STOMP riêng.
 */
type State = {
  roomListMessageSeq: number;
  bumpRoomListMessage: () => void;
};

export const useChatRoomListRealtimeStore = create<State>((set) => ({
  roomListMessageSeq: 0,
  bumpRoomListMessage: () =>
    set((s) => ({ roomListMessageSeq: s.roomListMessageSeq + 1 })),
}));
