import { create } from "zustand";

type ActiveChatState = {
  /** The chat room ID currently being viewed, or null if not in a chat room. */
  activeChatRoomId: number | null;
  setActiveChatRoomId: (id: number | null) => void;
};

/**
 * Tracks which chat room the user is currently viewing.
 * Used by push notification logic to suppress notifications
 * for the room the user already has open ("smart mute").
 */
export const useActiveChatStore = create<ActiveChatState>((set) => ({
  activeChatRoomId: null,
  setActiveChatRoomId: (id) => set({ activeChatRoomId: id }),
}));
