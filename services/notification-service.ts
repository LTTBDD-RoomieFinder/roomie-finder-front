import { notificationApi } from "@/apis/notification-api";
import type { NotificationItem } from "@/types/notification";
import { unwrapApiData } from "@/utils/unwrap-api-response";

export const notificationService = {
  async getMyNotifications(): Promise<NotificationItem[]> {
    const res = await notificationApi.getMyNotifications();
    return unwrapApiData<NotificationItem[]>(res);
  },

  async getUnreadCount(): Promise<number> {
    const res = await notificationApi.getUnreadCount();
    return unwrapApiData<number>(res);
  },

  async markAllRead(): Promise<void> {
    await notificationApi.markAllRead();
  },

  async markRequestTabRead(): Promise<void> {
    await notificationApi.markRequestTabRead();
  },

  async markRead(id: number): Promise<void> {
    await notificationApi.markRead(id);
  },

  async upsertFcmToken(fcmToken: string | null): Promise<void> {
    await notificationApi.upsertFcmToken({ fcmToken });
  },
};
