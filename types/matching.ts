/**
 * Tiêu chí con trong breakdown.
 * - rawScore: điểm 0–100 cho mục đó (UI chỉ hiển thị giá trị này, không hiển thị weightedScore).
 */
export type CriteriaScore = {
  key?: string | null;
  label?: string | null;
  /** Trọng số tương đối 1–5 (ảnh hưởng đến điểm tổng; UI dịch thành mức “quan trọng”). */
  weight?: number | null;
  rawScore?: number | null;
  weightedScore?: number | null;
  comment?: string | null;
};

/** Mirrors backend MatchDetailResponse. */
export type MatchDetailResponse = {
  userA?: string | null;
  userB?: string | null;
  totalScore?: number | null;
  label?: string | null;
  breakdown?: CriteriaScore[] | null;
};
