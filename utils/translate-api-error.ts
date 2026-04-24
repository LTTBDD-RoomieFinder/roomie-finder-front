import type { ReviewSummaryResponse } from "@/types/reputation";

/**
 * Một số bản build backend trả message rỗng nghĩa như "Uncategorized error" —
 * map sang copy an toàn cho UI (dùng với `t` từ i18n).
 */
export function translateApiRejection(
  e: unknown,
  t: (k: string) => string,
  genericKey = "publicUser.loadError" as const,
  serverErrorKey = "publicUser.serverError" as const,
): string {
  if (typeof e === "string") {
    const s = e.trim();
    if (!s) return t(genericKey);
    if (/uncategorized/i.test(s)) return t(genericKey);
    if (
      /server error, please try again later/i.test(s) ||
      /^server error /i.test(s) ||
      /^Unexpected error/i.test(s)
    ) {
      return t(serverErrorKey);
    }
    return s;
  }
  return t(genericKey);
}

export const EMPTY_REVIEW_SUMMARY: ReviewSummaryResponse = {
  userId: 0,
  averageRating: 0,
  totalReviews: 0,
  reviews: [],
};
