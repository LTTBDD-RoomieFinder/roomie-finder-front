import { create } from "zustand";

import type { NotificationItem, NotificationType } from "@/types/notification";
import {
  isRequestNotificationType,
  isUnreadPayload,
} from "@/utils/notification-helpers";

type NotificationState = {
  lastNotification: NotificationItem | null;
  requestSeq: number;
  messageSeq: number;
  requestUnreadCount: number;
  chatUnreadRoomsCount: number;
  notify: (n: NotificationItem) => void;
  setRequestUnreadCount: (n: number) => void;
  setChatUnreadRoomsCount: (n: number) => void;
};

function isRequestType(t: NotificationType | string): boolean {
  return isRequestNotificationType(t);
}

export const useNotificationStore = create<NotificationState>((set) => ({
  lastNotification: null,
  requestSeq: 0,
  messageSeq: 0,
  requestUnreadCount: 0,
  chatUnreadRoomsCount: 0,
  notify: (n) =>
    set((s) => {
      const unread = isUnreadPayload(n.read);
      const isReq = isRequestType(n.type);
      const isNewRequestEvent =
        isReq && (!s.lastNotification || s.lastNotification.id !== n.id);
      const bumpRequestBadge = isNewRequestEvent && unread;
      const isNewMessage =
        String(n.type ?? "") === "NEW_MESSAGE" &&
        (!s.lastNotification || s.lastNotification.id !== n.id);
      return {
        lastNotification: n,
        requestSeq: isNewRequestEvent ? s.requestSeq + 1 : s.requestSeq,
        messageSeq: isNewMessage ? s.messageSeq + 1 : s.messageSeq,
        requestUnreadCount: bumpRequestBadge
          ? s.requestUnreadCount + 1
          : s.requestUnreadCount,
      };
    }),
  setRequestUnreadCount: (n) =>
    set(() => {
      const v = Math.trunc(Number(n));
      return {
        requestUnreadCount: Number.isFinite(v) ? Math.max(0, v) : 0,
      };
    }),
  setChatUnreadRoomsCount: (n) =>
    set(() => {
      const v = Math.trunc(Number(n));
      return {
        chatUnreadRoomsCount: Number.isFinite(v) ? Math.max(0, v) : 0,
      };
    }),
}));
