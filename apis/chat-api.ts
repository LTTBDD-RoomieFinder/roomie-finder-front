import axiosRequest from "@/config/axios";

const API_PATH = "/chatrooms";

export const chatApi = {
  getChatRooms: () => axiosRequest.get(API_PATH),

  getChatRoomDetails: (id: number) => axiosRequest.get(`${API_PATH}/${id}`),

  deleteChatRoom: (id: number) => axiosRequest.delete(`${API_PATH}/${id}`),

  markMessagesSeen: (id: number) => axiosRequest.post(`${API_PATH}/${id}/seen`),

  leaveChatRoom: (id: number) => axiosRequest.post(`${API_PATH}/${id}/leave`),

  kickChatRoomMember: (id: number, memberUserId: number) =>
    axiosRequest.post(`${API_PATH}/${id}/kick`, null, {
      params: { memberUserId },
    }),

  getMessages: (id: number, params?: { cursor?: number; size?: number }) =>
    axiosRequest.get(`${API_PATH}/${id}/messages`, { params }),
};
