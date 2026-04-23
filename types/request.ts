/** Matches backend RequestStatus enum. */
export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

/** User in request/chat context; matches backend UserResponse. */
export type UserResponse = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  avatarUrl?: string | null;
};

/** Chat room created when request is ACCEPTED; matches backend ChatRoomResponse. */
export type ChatRoomResponse = {
  id: number;
  status: string;
  createdAt: string;
};

/** Full request payload from API; matches backend RequestResponse. */
export type RequestResponse = {
  id: number;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  createdBy: UserResponse;
  sender: UserResponse;
  receiver: UserResponse;
  modifiedBy: UserResponse | null;
  chatRoom: ChatRoomResponse | null;
};
