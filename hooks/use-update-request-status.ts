import { useCallback, useState } from "react";
import { requestService } from "@/services/request";
import type { UpdateRequestStatusRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";

export type UseUpdateRequestStatusResult = {
  updateStatus: (
    id: number,
    payload: UpdateRequestStatusRequest
  ) => Promise<RequestResponse | null>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
};

/** Update request status (PUT /requests/:id). Only receiver can set ACCEPTED or REJECTED. */
export function useUpdateRequestStatus(): UseUpdateRequestStatusResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (id: number, payload: UpdateRequestStatusRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        return await requestService.updateStatus(id, payload);
      } catch (err) {
        const msg = typeof err === "string" ? err : "Failed to update status.";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetError = useCallback(() => setError(null), []);

  return { updateStatus, isLoading, error, resetError };
}
