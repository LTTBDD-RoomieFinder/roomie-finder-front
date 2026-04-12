import axiosRequest from "@/config/axios";
import type { CreateReviewRequest } from "@/data/request";

const PATH = "/reviews";

export const reviewApi = {
  create: (body: CreateReviewRequest) =>
    axiosRequest.post(PATH, body),

  getSummaryByUserId: (userId: number | string) =>
    axiosRequest.get(`${PATH}/users/${userId}`),
};
