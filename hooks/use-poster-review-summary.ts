import { useEffect, useState, useSyncExternalStore } from "react";

import { reviewService } from "@/services/review-service";
import type { ReviewSummaryResponse } from "@/types/reputation";

type CacheEntry = { data: ReviewSummaryResponse; ts: number };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 120_000;

let summaryRevision = 0;
const revisionListeners = new Set<() => void>();
function subscribeRevision(cb: () => void) {
  revisionListeners.add(cb);
  return () => revisionListeners.delete(cb);
}
function getRevision() {
  return summaryRevision;
}
function bumpRevision() {
  summaryRevision += 1;
  revisionListeners.forEach((fn) => fn());
}

/** Gọi sau khi gửi review mới để bài đăng trên feed cập nhật ngay. */
export function invalidatePosterReviewSummaryCache(userId: string | number | null | undefined) {
  if (userId == null || userId === "") return;
  cache.delete(String(userId));
  bumpRevision();
}

export function usePosterReviewSummary(userId: string | number | undefined | null) {
  const revision = useSyncExternalStore(subscribeRevision, getRevision, getRevision);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);

  useEffect(() => {
    if (userId == null || userId === "") {
      setLoading(false);
      setSummary(null);
      return;
    }
    const key = String(userId);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      setSummary(hit.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void reviewService
      .getSummaryByUserId(key)
      .then((data) => {
        if (cancelled) return;
        cache.set(key, { data, ts: Date.now() });
        setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, revision]);

  return { loading, summary };
}
