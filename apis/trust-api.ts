import axiosRequest from "@/config/axios";

const PATH = "/trust";

export const trustApi = {
  getByUserId: (userId: number | string) =>
    axiosRequest.get(`${PATH}/users/${userId}`),

  getMine: () =>
    axiosRequest.get(`${PATH}/me`),

  recalculate: () =>
    axiosRequest.post(`${PATH}/recalculate`),
};
