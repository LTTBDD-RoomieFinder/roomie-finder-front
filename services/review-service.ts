import { reviewApi } from "@/apis/review-api";
import type { CreateReviewRequest } from "@/data/request";
import type { ReviewResponse, ReviewSummaryResponse } from "@/types/reputation";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const reviewService = {
  async create(body: CreateReviewRequest): Promise<ReviewResponse> {
    return unwrap<ReviewResponse>(await reviewApi.create(body));
  },

  async getSummaryByUserId(userId: number | string): Promise<ReviewSummaryResponse> {
    return unwrap<ReviewSummaryResponse>(await reviewApi.getSummaryByUserId(userId));
  },
};
