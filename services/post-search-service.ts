import { postSearchApi } from "@/apis/post-search-api";
import { PostSearchRequest } from "@/data/request";

export const postSearchService = {
  async searchPosts(request: PostSearchRequest) {
    const response = await postSearchApi.searchPosts(request);
    return (response as any)?.data;
  },
};