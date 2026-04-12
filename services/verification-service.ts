import { verificationApi } from "@/apis/verification-api";
import type { SubmitVerificationRequest } from "@/data/request";
import type { VerificationResponse } from "@/types/reputation";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const verificationService = {
  async submit(body: SubmitVerificationRequest): Promise<VerificationResponse> {
    return unwrap<VerificationResponse>(await verificationApi.submit(body));
  },

  async getMyStatus(): Promise<VerificationResponse> {
    return unwrap<VerificationResponse>(await verificationApi.getMyStatus());
  },

  async adminList(status?: string): Promise<VerificationResponse[]> {
    return unwrap<VerificationResponse[]>(await verificationApi.adminList(status));
  },

  async adminReview(
    id: number,
    body: { status: "VERIFIED" | "REJECTED"; reviewNote?: string | null }
  ): Promise<VerificationResponse> {
    return unwrap<VerificationResponse>(await verificationApi.adminReview(id, body));
  },
};
