import { matchingApi } from "@/apis/matching-api";
import type { UpdateDealBreakersRequest } from "@/data/request";
import type { MatchDetailResponse } from "@/types/matching";
import type {
  EnhancedMatchSuggestionResponse,
  MatchSuggestionResponse,
  RoomFitScoreResponse,
} from "@/types/reputation";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const matchingService = {
  async getMatchDetail(targetUserId: number | string): Promise<MatchDetailResponse> {
    return unwrap<MatchDetailResponse>(await matchingApi.getDetail(targetUserId));
  },

  async getSuggestions(): Promise<MatchSuggestionResponse[]> {
    return unwrap<MatchSuggestionResponse[]>(await matchingApi.getSuggestions());
  },

  async getEnhancedSuggestions(): Promise<EnhancedMatchSuggestionResponse[]> {
    return unwrap<EnhancedMatchSuggestionResponse[]>(await matchingApi.getEnhancedSuggestions());
  },

  async getRoomFitScore(postId: number | string): Promise<RoomFitScoreResponse> {
    return unwrap<RoomFitScoreResponse>(await matchingApi.getRoomFitScore(postId));
  },

  async updateDealBreakers(body: UpdateDealBreakersRequest): Promise<void> {
    await matchingApi.updateDealBreakers(body);
  },
};
