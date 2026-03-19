import { useCallback, useState } from "react";
import { requestService } from "@/services/request-service";
import type { RequestRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";

export type UseCreateRequestResult = {
  create: (payload: RequestRequest) => Promise<RequestResponse | null>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
};

/** Create roommate invitation (POST /requests). Errors from backend (e.g. duplicate, cooldown) are set in error. */
export function useCreateRequest(): UseCreateRequestResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: RequestRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await requestService.create(payload);
    } catch (err) {
      const msg = typeof err === "string" ? err : "Không thể gửi lời mời.";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return { create, isLoading, error, resetError };
}
