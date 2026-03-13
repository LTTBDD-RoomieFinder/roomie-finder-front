import { useCallback, useState } from "react";
import { requestService } from "@/services/request";
import type { RequestResponse } from "@/types/request";

export type UseRequestsResult = {
  incoming: RequestResponse[];
  outgoing: RequestResponse[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/** Incoming (received) and outgoing (sent) requests; refetch loads both in parallel. */
export function useRequests(): UseRequestsResult {
  const [incoming, setIncoming] = useState<RequestResponse[]>([]);
  const [outgoing, setOutgoing] = useState<RequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [incomingData, outgoingData] = await Promise.all([
        requestService.getIncoming(),
        requestService.getOutgoing(),
      ]);
      setIncoming(incomingData ?? []);
      setOutgoing(outgoingData ?? []);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to load invitations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { incoming, outgoing, isLoading, error, refetch };
}
