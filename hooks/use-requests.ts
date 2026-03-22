import { useCallback, useState } from "react";
import { requestService } from "@/services/request-service";
import { useAuthStore } from "@/stores/useAuthStore";
import type { RequestResponse } from "@/types/request";

export type UseRequestsResult = {
  incoming: RequestResponse[];
  outgoing: RequestResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: (opts?: { silent?: boolean }) => Promise<void>;
};

/** Incoming (received) and outgoing (sent) requests; refetch loads both in parallel. */
export function useRequests(): UseRequestsResult {
  const [incoming, setIncoming] = useState<RequestResponse[]>([]);
  const [outgoing, setOutgoing] = useState<RequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!useAuthStore.getState().isAuthenticated) {
      setIncoming([]);
      setOutgoing([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const [incomingData, outgoingData] = await Promise.all([
        requestService.getIncoming(),
        requestService.getOutgoing(),
      ]);
      setIncoming(incomingData ?? []);
      setOutgoing(outgoingData ?? []);
    } catch (err) {
      if (!silent) {
        setError(typeof err === "string" ? err : "Không thể tải danh sách lời mời.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  return { incoming, outgoing, isLoading, error, refetch };
}
