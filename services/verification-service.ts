import { verificationApi } from "@/apis/verification-api";
import type { SubmitVerificationRequest } from "@/data/request";
import type { VerificationResponse } from "@/types/reputation";

/**
 * Axios interceptor already strips the outer axios wrapper (returns response.data).
 * Backend wraps results in { code, data: <payload> }.
 * unwrap() extracts the inner `data` field if present.
 */
function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/**
 * For list endpoints the payload might be:
 *  - a plain array []
 *  - a Spring Page { content: [], totalElements, ... }
 *  - or still wrapped { data: [] }
 * Returns a raw (unwrapped once) payload so the caller can normalise further.
 */
function unwrapRaw(res: unknown): unknown {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as Record<string, unknown>).data;
  }
  return res;
}

export const verificationService = {
  async submit(body: SubmitVerificationRequest): Promise<VerificationResponse> {
    return unwrap<VerificationResponse>(await verificationApi.submit(body));
  },

  async getMyStatus(): Promise<VerificationResponse> {
    return unwrap<VerificationResponse>(await verificationApi.getMyStatus());
  },

  /** Returns the raw payload — caller (AdminVerificationsScreen) normalises to array. */
  async adminList(status?: string): Promise<unknown> {
    return unwrapRaw(await verificationApi.adminList(status));
  },

  async adminReview(
    id: number,
    body: { status: "VERIFIED" | "REJECTED"; reviewNote?: string | null }
  ): Promise<VerificationResponse> {
    return unwrap<VerificationResponse>(await verificationApi.adminReview(id, body));
  },
};
