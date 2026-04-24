import axiosRequest from "@/config/axios";

const API_PATH = "/notifications";

export const notificationApi = {
  getMyNotifications: () => axiosRequest.get(API_PATH),
  getUnreadCount: () => axiosRequest.get(`${API_PATH}/unread-count`),
  markAllRead: () => axiosRequest.post(`${API_PATH}/read-all`),
  markRequestTabRead: () =>
    axiosRequest.post(`${API_PATH}/read-request-tab`),
  markRead: (id: number) => axiosRequest.post(`${API_PATH}/${id}/read`),
  upsertFcmToken: (payload: { fcmToken: string | null }) =>
    axiosRequest.put(`${API_PATH}/fcm-token`, payload),
};
