import { reportApi } from "@/apis/report-api";
import type { SubmitReportRequest } from "@/data/request";
import type { ReportResponse } from "@/types/reputation";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const reportService = {
  async submit(body: SubmitReportRequest): Promise<ReportResponse> {
    return unwrap<ReportResponse>(await reportApi.submit(body));
  },

  async adminList(status?: string): Promise<ReportResponse[]> {
    return unwrap<ReportResponse[]>(await reportApi.adminList(status));
  },

  async adminUpdate(
    id: number,
    body: { status: string; adminNote?: string }
  ): Promise<ReportResponse> {
    return unwrap<ReportResponse>(await reportApi.adminUpdate(id, body));
  },
};
