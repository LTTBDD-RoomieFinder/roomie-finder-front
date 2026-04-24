import axiosRequest from "@/config/axios";
import type { SubmitReportRequest } from "@/data/request";

const PATH = "/reports";
const ADMIN_PATH = "/reports/admin";

export const reportApi = {
  submit: (body: SubmitReportRequest) =>
    axiosRequest.post(PATH, body),

  // Admin endpoints
  adminList: (status?: string) =>
    axiosRequest.get(ADMIN_PATH, { params: status ? { status } : undefined }),

  adminUpdate: (id: number, body: { status: string; adminNote?: string | null }) =>
    axiosRequest.put(`${ADMIN_PATH}/${id}`, body),
};
