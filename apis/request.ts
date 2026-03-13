import axiosRequest from "@/config/axios";
import type { RequestRequest, UpdateRequestStatusRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";

const API_PATH = "/requests";

function unwrapData<T>(body: { data?: T } | T): T {
  if (body && typeof body === "object" && "data" in body && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const requestApi = {
  create: async (payload: RequestRequest) => {
    const response = await axiosRequest.post(API_PATH, payload);
    return unwrapData<RequestResponse>(response);
  },

  updateStatus: async (id: number, payload: UpdateRequestStatusRequest) => {
    const response = await axiosRequest.put(`${API_PATH}/${id}`, payload);
    return unwrapData<RequestResponse>(response);
  },

  getIncoming: async () => {
    const response = await axiosRequest.get(`${API_PATH}/incoming`);
    return unwrapData<RequestResponse[]>(response);
  },

  getOutgoing: async () => {
    const response = await axiosRequest.get(`${API_PATH}/outgoing`);
    return unwrapData<RequestResponse[]>(response);
  },
};
