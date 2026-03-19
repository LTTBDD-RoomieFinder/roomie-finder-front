import type { RequestStatus } from "@/types/request";

export const REQUEST_REJECT_COOLDOWN_DAYS = 7;

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "Chờ xử lý",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
};

export const REQUEST_STATUS_COLOR: Record<RequestStatus, string> = {
  PENDING: "#f59e0b",
  ACCEPTED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#6b7280",
  EXPIRED: "#6b7280",
};

export const REQUEST_ERROR_MESSAGES = {
  DUPLICATE: "Đã tồn tại lời mời giữa bạn và người dùng này (đang chờ hoặc đã chấp nhận).",
  COOLDOWN: "Bạn có thể gửi lời mời mới sau thời gian chờ.",
  NOT_RECEIVER: "Chỉ người nhận mới có thể chấp nhận hoặc từ chối lời mời này.",
  CANNOT_SEND_TO_SELF: "Bạn không thể gửi lời mời cho chính mình.",
} as const;
