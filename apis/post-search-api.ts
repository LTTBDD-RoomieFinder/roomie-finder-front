import axiosRequest from "@/config/axios";
import { PostSearchRequest } from "@/data/request";

export const postSearchApi = {
  searchPosts(request: PostSearchRequest) {
    return axiosRequest.post("/search/posts", request);
  },
  getRecommendedPosts(params?: { cursor?: number; size?: number }) {
    return axiosRequest.get("/search/posts/recommended", { params });
  },
};
