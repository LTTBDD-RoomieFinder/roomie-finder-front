import axiosRequest from "@/config/axios";
import type { UpdateDealBreakersRequest } from "@/data/request";

const API_PATH = "/matching";

export const matchingApi = {
  getDetail: (targetUserId: number | string) =>
    axiosRequest.get(`${API_PATH}/detail/${targetUserId}`),

  getSuggestions: () =>
    axiosRequest.get(`${API_PATH}/suggestions`),

  getEnhancedSuggestions: () =>
    axiosRequest.get(`${API_PATH}/suggestions/enhanced`),

  getRoomFitScore: (postId: number | string) =>
    axiosRequest.get(`${API_PATH}/room-fit/${postId}`),

  updateDealBreakers: (body: UpdateDealBreakersRequest) =>
    axiosRequest.put(`${API_PATH}/deal-breakers`, body),
};
