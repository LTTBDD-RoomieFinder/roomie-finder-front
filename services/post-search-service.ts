import { postSearchApi } from "@/apis/post-search-api";
import { PostSearchRequest } from "@/data/request";

export const postSearchService = {
  async searchPosts(request: PostSearchRequest) {
    try {
      console.log("📤 [Search Request Payload]:", JSON.stringify(request, null, 2));

      const response = await postSearchApi.searchPosts(request);
      return (response as any)?.data;
      
    } catch (error: any) {
      console.error("🚨 [Search API Error]:", {
        status: error?.response?.status,
        message: error?.message,
        backendError: error?.response?.data, 
      });

      const errorMessage = error?.response?.data?.message 
                        || error?.message 
                        || "Đã có lỗi xảy ra khi tìm kiếm phòng trọ.";
                        
      throw new Error(errorMessage);
    }
  },
};