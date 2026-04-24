import { useCallback, useEffect, useState } from "react";

import type { SmartMatchProfile } from "@/components/discovery/types";
import { matchingService } from "@/services/matching-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { mapEnhancedListToProfiles } from "@/utils/enhanced-suggestion-to-smart-profile";

type TFn = (key: string, options?: Record<string, string | number>) => string;

export function useSmartMatchSuggestions(t: TFn) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [profiles, setProfiles] = useState<SmartMatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setProfiles([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await matchingService.getEnhancedSuggestions();
      const list = Array.isArray(res) ? res : [];
      setProfiles(mapEnhancedListToProfiles(list, t));
    } catch (e) {
      setProfiles([]);
      setError(
        typeof e === "string" && e.trim()
          ? e
          : t("smartMatch.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profiles, loading, error, refetch: load, isAuthenticated };
}
