import { requestApi } from "@/apis/request-api";
import type { RequestRequest, UpdateRequestStatusRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";
import {
  normalizeRequestListFromApi,
  normalizeRequestResponseFromApi,
} from "@/utils/normalize-user";
import { unwrapApiData } from "@/utils/unwrap-api-response";

export const requestService = {
  async create(payload: RequestRequest): Promise<RequestResponse> {
    const res = await requestApi.create(payload);
    return normalizeRequestResponseFromApi(unwrapApiData<RequestResponse>(res));
  },

  async updateStatus(
    id: number,
    payload: UpdateRequestStatusRequest,
  ): Promise<RequestResponse> {
    const res = await requestApi.updateStatus(id, payload);
    return normalizeRequestResponseFromApi(unwrapApiData<RequestResponse>(res));
  },

  async getIncoming(): Promise<RequestResponse[]> {
    const res = await requestApi.getIncoming();
    return normalizeRequestListFromApi(unwrapApiData<RequestResponse[]>(res));
  },

  async getOutgoing(): Promise<RequestResponse[]> {
    const res = await requestApi.getOutgoing();
    return normalizeRequestListFromApi(unwrapApiData<RequestResponse[]>(res));
  },

  async getById(id: number): Promise<RequestResponse> {
    const res = await requestApi.getById(id);
    return normalizeRequestResponseFromApi(unwrapApiData<RequestResponse>(res));
  },
};
