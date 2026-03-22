import { meApi } from "@/apis/me-api";
import { useNotificationStore } from "@/stores/use-notification-store";
import type { TabBadgeCounts } from "@/types/tab-badge";

function coerceFiniteInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.trunc(v);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}

/**
 * Duyệt BFS cây JSON từ GET /me/tab-badges (ApiResponse bọc data, camelCase/snake_case).
 * Tránh mất số khi unwrap một lớp không khớp với interceptor.
 */
function extractTabBadgeCountsDeep(raw: unknown): TabBadgeCounts | null {
  if (raw == null || typeof raw !== "object") return null;
  const queue: unknown[] = [raw];
  const seen = new Set<unknown>();
  let steps = 0;
  while (queue.length > 0 && steps < 80) {
    steps += 1;
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    const o = cur as Record<string, unknown>;
    const reqRaw =
      o.requestUnreadCount ?? o.request_unread_count ?? o.requestUnread;
    const chatRaw =
      o.chatRoomsWithUnreadCount ??
      o.chat_rooms_with_unread_count ??
      o.chatUnreadRoomsCount;
    const req = coerceFiniteInt(reqRaw);
    const chat = coerceFiniteInt(chatRaw);
    if (req !== undefined || chat !== undefined) {
      return {
        requestUnreadCount: Math.max(0, req ?? 0),
        chatRoomsWithUnreadCount: Math.max(0, chat ?? 0),
      };
    }
    for (const v of Object.values(o)) {
      if (v != null && typeof v === "object") queue.push(v);
    }
  }
  return null;
}

export async function fetchTabBadges(): Promise<TabBadgeCounts> {
  const res = await meApi.getTabBadges();
  return (
    extractTabBadgeCountsDeep(res) ?? {
      requestUnreadCount: 0,
      chatRoomsWithUnreadCount: 0,
    }
  );
}

/** Single HTTP call; updates Zustand tab badge counts (used by layout, focus, websocket). */
export async function syncTabBadgesToStore(): Promise<void> {
  try {
    const { requestUnreadCount, chatRoomsWithUnreadCount } =
      await fetchTabBadges();
    useNotificationStore.getState().setRequestUnreadCount(requestUnreadCount);
    useNotificationStore
      .getState()
      .setChatUnreadRoomsCount(chatRoomsWithUnreadCount);
  } catch (e) {
    if (__DEV__) {
      console.warn("[syncTabBadgesToStore] failed", e);
    }
  }
}
