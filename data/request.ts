import { Gender } from "@/constants/gender";
import { GenderRequirement, RoomType } from "@/types/enums";
import { PostStatus } from "@/types/PostStatus";

export type LoginRequest = {
  username: string;
  password: string;
};

export type RequestRequest = {
  receiverId: number;
  /** Bắt buộc khi gửi từ bài đăng — backend kiểm tra còn chỗ trong nhóm chat theo sức chứa phòng. */
  postId?: number;
  message?: string;
};

export type UpdateRequestStatusRequest = {
  status: "ACCEPTED" | "REJECTED";
};

/** Payload sent via STOMP to backend to create/send a chat message. */
export type SendMessagePayload = {
  chatRoomId: number;
  content: string;
  type?: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type RoomCreateRequest = {
  title: string;
  price: number;
  area: number;
  capacity: number;
  roomType: RoomType;
  genderRequirement: GenderRequirement;
  description: string;
  address: AddressCreateRequest;
  imageUrls: string[];
  amenityIds: number[];
};

export type AddressCreateRequest = {
  streetAddress: string;
  cityId: number;
  districtId: number;
  wardId: number;
};

export type PostCreateRequest = {
  title: string;
  content: string;
  roomId: number;
  status?: PostStatus;
  expirationDate?: string;
};

export type PostUpdateRequest = {
  title?: string;
  content?: string;
  status?: PostStatus;
  expirationDate?: string;
}

export type PostSearchRequest = {
  keyword?: string;
  genderRequirement?: GenderRequirement;
  roomType?: RoomType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  capacity?: number;
  amenityIds?: number[];
  cityName?: string;
  districtName?: string;
  wardName?: string;
  userLat?: number;
  userLng?: number;
  radiusInKm?: number;
  cursor?: number;
  size?: number;
}

export interface BaseProfileRequest {
  fullName: string;
  gender: Gender;
  avatarUrl: string;
  budgetMin: number;
  budgetMax: number;
  isSmoker: boolean;
  hasPet: boolean;
  sleepSchedule: string;
  cleanliness: number;
  hometown: string;
  workplace: string;
  streetAddress: string;
  wardId: number;
  districtId: number;
  cityId: number;
  tagIds: number[];
}

export type CreateProfileRequest = BaseProfileRequest;
export type UpdateProfileRequest = BaseProfileRequest;
