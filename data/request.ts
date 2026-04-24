import { Gender } from "@/constants/gender";
import {
  DealBreakerType,
  GenderRequirement,
  ReportCategory,
  ReportTargetType,
  ReviewContext,
  RoomType,
} from "@/types/enums";
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
};

/**
 * Bounding box cho map pins — khớp backend `MapPinRequest`
 * (`minLat`, `maxLat`, `minLng`, `maxLng`, validation `@NotNull`).
 */
export type MapPinsBBoxRequest = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** Alias tên giống Spring bean `MapPinRequest`. */
export type MapPinRequest = MapPinsBBoxRequest;

export interface BaseProfileRequest {
  fullName: string;
  gender: Gender;
  avatarUrl: string;
  budgetMin: number;
  budgetMax: number;
  hometown: string;
  workplace: string;
  streetAddress: string;
  wardId: number;
  districtId: number;
  cityId: number;
  tagIds: number[];
}

/** Optional profile fields — omit from request unless user set/changed them. */
export type ProfileOptionalFields = {
  isSmoker?: boolean | null;
  hasPet?: boolean | null;
  sleepSchedule?: string | null;
  cleanliness?: number | null;
};

export type CreateProfileRequest = BaseProfileRequest & ProfileOptionalFields;
export type UpdateProfileRequest = BaseProfileRequest & ProfileOptionalFields;

// ── Identity Verification ────────────────────────────────────────────────────

export type SubmitVerificationRequest = {
  documentNumber: string;
  documentImageUrl: string;
  documentBackImageUrl?: string;
  selfieImageUrl: string;
};

// ── Deal-breakers ─────────────────────────────────────────────────────────────

export type UpdateDealBreakersRequest = {
  dealBreakers: DealBreakerType[];
};

// ── Reviews ──────────────────────────────────────────────────────────────────

export type CreateReviewRequest = {
  revieweeId: number;
  rating: number;
  comment?: string;
  context: ReviewContext;
};

// ── Reports ──────────────────────────────────────────────────────────────────

export type SubmitReportRequest = {
  targetType: ReportTargetType;
  targetId: number;
  category: ReportCategory;
  details: string;
};
