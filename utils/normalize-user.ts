import type { RequestResponse, UserResponse } from "@/types/request";
import { formatPublicDisplayName } from "@/utils/display-name";

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

/**
 * Gộp DTO user từ backend (camelCase / snake_case) về `UserResponse`.
 */
export function normalizeUserFromApi(raw: unknown): UserResponse {
  if (!raw || typeof raw !== "object") {
    return { id: "", username: "", email: "", fullName: "", roles: [] };
  }
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  const fullName = str(o.fullName ?? o.full_name);
  const username = str(o.username ?? o.user_name);
  const email = str(o.email);
  const roles = Array.isArray(o.roles) ? o.roles.map((x) => String(x)) : [];

  let avatarUrl: string | null | undefined;
  if (typeof o.avatarUrl === "string" && o.avatarUrl.trim()) {
    avatarUrl = o.avatarUrl.trim();
  } else if (typeof o.avatar_url === "string" && o.avatar_url.trim()) {
    avatarUrl = o.avatar_url.trim();
  } else if (o.avatarUrl === null || o.avatar_url === null) {
    avatarUrl = null;
  } else {
    avatarUrl = undefined;
  }

  return { id, username, email, fullName, roles, avatarUrl };
}

/**
 * Tên hiển thị: ưu tiên họ tên; chỉ dùng username (đã humanize) khi không có họ tên.
 */
export function displayNameForUser(u: UserResponse, nameFallback: string): string {
  return formatPublicDisplayName(u.fullName, u.username, nameFallback);
}

function normalizeRequestResponseOne(r: RequestResponse): RequestResponse {
  return {
    ...r,
    createdBy: normalizeUserFromApi(r.createdBy),
    sender: normalizeUserFromApi(r.sender),
    receiver: normalizeUserFromApi(r.receiver),
    modifiedBy: r.modifiedBy ? normalizeUserFromApi(r.modifiedBy) : r.modifiedBy,
  };
}

export function normalizeRequestResponseFromApi(raw: RequestResponse): RequestResponse {
  return normalizeRequestResponseOne(raw);
}

export function normalizeRequestListFromApi(
  list: RequestResponse[] | null | undefined,
): RequestResponse[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeRequestResponseOne);
}
