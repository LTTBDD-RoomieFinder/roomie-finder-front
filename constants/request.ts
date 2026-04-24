import type { RequestStatus } from "@/types/request";

export const REQUEST_REJECT_COOLDOWN_DAYS = 7;

export const REQUEST_STATUS_LABEL_KEY: Record<RequestStatus, string> = {
  PENDING: "request.status.PENDING",
  ACCEPTED: "request.status.ACCEPTED",
  REJECTED: "request.status.REJECTED",
  CANCELLED: "request.status.CANCELLED",
  EXPIRED: "request.status.EXPIRED",
};

export const REQUEST_STATUS_COLOR: Record<RequestStatus, string> = {
  PENDING: "#f59e0b",
  ACCEPTED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#6b7280",
  EXPIRED: "#6b7280",
};

/** Backend / client error codes → i18n keys (`request.errors.*`). */
export const REQUEST_ERROR_MESSAGE_KEYS = {
  DUPLICATE: "request.errors.duplicate",
  COOLDOWN: "request.errors.cooldown",
  NOT_RECEIVER: "request.errors.notReceiver",
  CANNOT_SEND_TO_SELF: "request.errors.cannotSendToSelf",
} as const;
