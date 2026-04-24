import { reportApi } from "@/apis/report-api";
import type { SubmitReportRequest } from "@/data/request";
import type { ReportResponse } from "@/types/reputation";
import {
  extractReportList,
  normalizeReportResponse,
} from "@/utils/normalize-report";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

function unwrapRaw(res: unknown): unknown {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as Record<string, unknown>).data;
  }
  return res;
}

export const reportService = {
  async submit(body: SubmitReportRequest): Promise<ReportResponse> {
    const raw = unwrap<unknown>(await reportApi.submit(body));
    return normalizeReportResponse(raw);
  },

  async adminList(status?: string): Promise<ReportResponse[]> {
    const raw = unwrapRaw(await reportApi.adminList(status));
    return extractReportList(raw);
  },

  async adminUpdate(
    id: number,
    body: { status: string; adminNote?: string | null },
  ): Promise<ReportResponse> {
    const raw = unwrap<unknown>(await reportApi.adminUpdate(id, body));
    return normalizeReportResponse(raw);
  },
};
