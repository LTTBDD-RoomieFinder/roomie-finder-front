import { useCallback, useEffect, useMemo, useState } from "react";

import { postService } from "@/services/post-service";
import type { PostJoinEligibility } from "@/types/post-join-eligibility";

/**
 * Gọi batch API một lần cho các bài không phải của user; map postId → eligibility.
 */
export function usePostsJoinEligibility(
  postIdsNeedingCheck: number[],
  enabled: boolean,
): {
  eligibilityByPostId: Record<number, PostJoinEligibility>;
  loading: boolean;
  error: boolean;
  refresh: () => void;
} {
  const [eligibilityByPostId, setEligibilityByPostId] = useState<
    Record<number, PostJoinEligibility>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  const key = useMemo(
    () => [...new Set(postIdsNeedingCheck)].sort((a, b) => a - b).join(","),
    [postIdsNeedingCheck],
  );

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled || !key) {
      setEligibilityByPostId({});
      setError(false);
      return;
    }
    const ids = key.split(",").map(Number).filter(Boolean);
    let cancelled = false;
    setLoading(true);
    setError(false);
    postService
      .getJoinChatEligibilityBatch(ids)
      .then((rows) => {
        if (cancelled) return;
        const next: Record<number, PostJoinEligibility> = {};
        for (const row of rows) {
          next[row.postId] = row;
        }
        setEligibilityByPostId(next);
      })
      .catch(() => {
        if (!cancelled) {
          setEligibilityByPostId({});
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, key, tick]);

  return { eligibilityByPostId, loading, error, refresh };
}
