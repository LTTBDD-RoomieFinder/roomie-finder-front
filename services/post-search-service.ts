import { postSearchApi } from "@/apis/post-search-api";
import { PostSearchRequest } from "@/data/request";
import { RoomResponse } from "@/data/response";

export type PostSearchAuthorResponse = {
  id?: number;
  fullName: string;
  username?: string;
  phoneNumber?: string;
};

export type PostSearchUserResponse = {
  id?: number | string;
  fullName?: string;
  username?: string;
};

export type PostSearchResponse = {
  id: number;
  title: string;
  content: string;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  room: RoomResponse;
  author?: PostSearchAuthorResponse;
  user?: PostSearchUserResponse;
};

export type RecommendedPostResponse = {
  post: PostSearchResponse;
  profileAvgScore: number;
  roomScore: number;
  totalScore: number;
};

export type CursorResponse<T> = {
  data: T[];
  nextCursor: number | null;
  hasNext: boolean;
};

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

  async getRecommendedPosts(params?: { cursor?: number; size?: number }) {
    try {
      const response = await postSearchApi.getRecommendedPosts(params);
      return (response as any)?.data as CursorResponse<RecommendedPostResponse>;
    } catch (error: any) {
      console.error("🚨 [Recommended API Error]:", {
        status: error?.response?.status,
        message: error?.message,
        backendError: error?.response?.data,
      });

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Đã có lỗi xảy ra khi tải danh sách đề xuất.";
      throw new Error(errorMessage);
    }
  },
};