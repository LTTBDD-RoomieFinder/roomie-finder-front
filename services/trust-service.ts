import { trustApi } from "@/apis/trust-api";
import type { TrustScoreResponse } from "@/types/reputation";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const trustService = {
  async getByUserId(userId: number | string): Promise<TrustScoreResponse> {
    return unwrap<TrustScoreResponse>(await trustApi.getByUserId(userId));
  },

  async getMine(): Promise<TrustScoreResponse> {
    return unwrap<TrustScoreResponse>(await trustApi.getMine());
  },

  async recalculate(): Promise<TrustScoreResponse> {
    return unwrap<TrustScoreResponse>(await trustApi.recalculate());
  },
};
