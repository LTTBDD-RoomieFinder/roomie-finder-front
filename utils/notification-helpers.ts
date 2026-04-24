import type { NotificationItem } from "@/types/notification";

/** Chuẩn hóa so khớp type từ STOMP/JSON (enum, string lệch). */
export function isRequestNotificationType(type: unknown): boolean {
  const t = String(type ?? "");
  if (
    t === "REQUEST_RECEIVED" ||
    t === "REQUEST_ACCEPTED" ||
    t === "REQUEST_REJECTED"
  ) {
    return true;
  }
  if (
    t.includes("REQUEST_RECEIVED") ||
    t.includes("REQUEST_ACCEPTED") ||
    t.includes("REQUEST_REJECTED")
  ) {
    return true;
  }
  return false;
}

export function isUnreadPayload(read: unknown): boolean {
  return read !== true;
}

/**
 * Chuẩn hóa body STOMP → NotificationItem (Jackson/Lombok: read vs isRead, enum, id).
 */
export function parseNotificationFromStompBody(
  raw: Record<string, unknown>,
): NotificationItem {
  const readRaw = raw.read ?? raw.isRead;
  let id = 0;
  const idVal = raw.id;
  if (typeof idVal === "number" && Number.isFinite(idVal)) id = idVal;
  else if (typeof idVal === "string" && idVal.trim() !== "") {
    const n = Number(idVal);
    if (Number.isFinite(n)) id = n;
  }
  let referenceId: number | null = null;
  if (raw.referenceId != null && raw.referenceId !== "") {
    const r =
      typeof raw.referenceId === "number"
        ? raw.referenceId
        : Number(raw.referenceId);
    referenceId = Number.isFinite(r) ? r : null;
  }

  return {
    id,
    actorId:
      typeof raw.actorId === "number"
        ? raw.actorId
        : raw.actorId != null && raw.actorId !== ""
          ? (() => {
              const a = Number(raw.actorId);
              return Number.isFinite(a) ? a : null;
            })()
          : null,
    type: String(raw.type ?? "") as NotificationItem["type"],
    title: String(raw.title ?? ""),
    content: String(raw.content ?? ""),
    referenceId,
    read: readRaw === true,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt:
      raw.updatedAt == null || raw.updatedAt === ""
        ? null
        : String(raw.updatedAt),
  };
}
