export const REQUEST_REJECT_COOLDOWN_DAYS = 7;

export const REQUEST_ERROR_MESSAGES = {
  DUPLICATE: "Đã tồn tại lời mời giữa bạn và người dùng này (đang chờ hoặc đã chấp nhận).",
  COOLDOWN: "Bạn có thể gửi lời mời mới sau thời gian chờ.",
  NOT_RECEIVER: "Chỉ người nhận mới có thể chấp nhận hoặc từ chối lời mời này.",
  CANNOT_SEND_TO_SELF: "Bạn không thể gửi lời mời cho chính mình.",
} as const;
