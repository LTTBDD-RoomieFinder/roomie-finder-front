export type PostJoinEligibility = {
  postId: number;
  canRequestJoinChatRoom: boolean;
  disabledReason:
    | "OWN_POST"
    | "CHAT_ROOM_FULL"
    | "ALREADY_REQUESTED"
    | "POST_NOT_FOUND"
    | null;
  roomCapacity: number;
  currentOccupancy: number;
};
