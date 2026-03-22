import axiosRequest from "@/config/axios";

const API_PATH = "/me";

export const meApi = {
  getTabBadges: () => axiosRequest.get(`${API_PATH}/tab-badges`),
};
