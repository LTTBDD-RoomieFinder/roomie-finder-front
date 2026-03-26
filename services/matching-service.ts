import { matchingApi } from "@/apis/matching-api";
import type { MatchDetailResponse } from "@/types/matching";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const matchingService = {
  async getMatchDetail(targetUserId: number | string): Promise<MatchDetailResponse> {
    const res = await matchingApi.getDetail(targetUserId);
    return unwrap<MatchDetailResponse>(res);
  },
};
