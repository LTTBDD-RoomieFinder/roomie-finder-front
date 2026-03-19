import axiosRequest from "@/config/axios";
import { PostSearchRequest } from "@/data/request";

export const postSearchApi = {
  searchPosts(request: PostSearchRequest) {
    return axiosRequest.post("/search/posts", request);
  },
};
