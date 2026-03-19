import type { UserResponse } from "@/types/request";

// Matches backend MessageConstants (e.g. TEXT/SYSTEM/IMAGE) but kept minimal
// to what UI logic depends on.
export type MessageType = "TEXT" | "JOIN" | "LEAVE" | "SYSTEM" | "IMAGE";

export type MessageStatus = "SENT" | "DELIVERED" | "SEEN";

/** Matches backend MessageResponse DTO. senderId and id are numeric (Long). */
export type ChatMessage = {
  id: number;
  content: string;
  type: MessageType;
  status: MessageStatus;
  senderId: number;
  chatRoomId: number;
  createdAt: string;
  seenByIds?: number[];
};

/** Matches backend ChatRoomResponse DTO from GET /chatrooms. */
export type ChatRoomItem = {
  id: number;
  status: string;
  createdAt: string;
  postTitle?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
};

/** Matches backend ChatRoomDetailsResponse DTO from GET /chatrooms/{id}. */
export type ChatRoomDetails = {
  id: number;
  status: string;
  createdAt: string;
  ownerId?: number | null;
  members: UserResponse[];
  postTitle?: string | null;
};

/** Matches backend CursorResponse<T>. */
export type CursorPage<T> = {
  data: T[];
  nextCursor: number | null;
  hasNext: boolean;
};
