import { requestApi } from "@/apis/request";
import type { RequestRequest, UpdateRequestStatusRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";

/** Request flow: create invitation, update status (accept/reject), list incoming/outgoing. */
export const requestService = {
  create(payload: RequestRequest): Promise<RequestResponse> {
    return requestApi.create(payload);
  },

  updateStatus(id: number, payload: UpdateRequestStatusRequest): Promise<RequestResponse> {
    return requestApi.updateStatus(id, payload);
  },

  getIncoming(): Promise<RequestResponse[]> {
    return requestApi.getIncoming();
  },

  getOutgoing(): Promise<RequestResponse[]> {
    return requestApi.getOutgoing();
  },
};
