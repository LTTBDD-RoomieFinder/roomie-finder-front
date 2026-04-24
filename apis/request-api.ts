import axiosRequest from "@/config/axios";
import type { RequestRequest, UpdateRequestStatusRequest } from "@/data/request";

const API_PATH = "/requests";

export const requestApi = {
  create: (payload: RequestRequest) =>
    axiosRequest.post(API_PATH, payload),

  updateStatus: (id: number, payload: UpdateRequestStatusRequest) =>
    axiosRequest.put(`${API_PATH}/${id}`, payload),

  getIncoming: () =>
    axiosRequest.get(`${API_PATH}/incoming`),

  getOutgoing: () =>
    axiosRequest.get(`${API_PATH}/outgoing`),

  getById: (id: number) =>
    axiosRequest.get(`${API_PATH}/${id}`),
};
