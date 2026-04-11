import axiosRequest from "@/config/axios";
import type { SubmitVerificationRequest } from "@/data/request";

const PATH = "/verifications";
const ADMIN_PATH = "/admin/verifications";

export const verificationApi = {
  submit: (body: SubmitVerificationRequest) =>
    axiosRequest.post(PATH, body),

  getMyStatus: () =>
    axiosRequest.get(`${PATH}/me`),

  // Admin endpoints
  adminList: (status?: string) =>
    axiosRequest.get(ADMIN_PATH, { params: status ? { status } : undefined }),

  adminReview: (id: number, body: { status: "VERIFIED" | "REJECTED"; reviewNote?: string | null }) =>
    axiosRequest.put(`${ADMIN_PATH}/${id}/review`, body),
};
