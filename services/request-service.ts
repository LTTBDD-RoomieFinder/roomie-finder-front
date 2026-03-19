import { requestApi } from "@/apis/request-api";
import type { RequestRequest, UpdateRequestStatusRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const requestService = {
  async create(payload: RequestRequest): Promise<RequestResponse> {
    const res = await requestApi.create(payload);
    return unwrap<RequestResponse>(res);
  },

  async updateStatus(
    id: number,
    payload: UpdateRequestStatusRequest,
  ): Promise<RequestResponse> {
    const res = await requestApi.updateStatus(id, payload);
    return unwrap<RequestResponse>(res);
  },

  async getIncoming(): Promise<RequestResponse[]> {
    const res = await requestApi.getIncoming();
    return unwrap<RequestResponse[]>(res);
  },

  async getOutgoing(): Promise<RequestResponse[]> {
    const res = await requestApi.getOutgoing();
    return unwrap<RequestResponse[]>(res);
  },
};
