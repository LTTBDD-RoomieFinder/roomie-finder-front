import axiosRequest from "@/config/axios";

const API_PATH = "/matching";

export const matchingApi = {
  getDetail: (targetUserId: number | string) =>
    axiosRequest.get(`${API_PATH}/detail/${targetUserId}`),
};
