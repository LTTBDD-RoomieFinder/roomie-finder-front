import axiosRequest from "@/config/axios";
import { PostCreateRequest, PostUpdateRequest } from "@/data/request";

export const postApi = {
  createPost: (body: PostCreateRequest) => {
    return axiosRequest.post("/posts", body);
  },

  getAllPosts: () => {
    return axiosRequest.get("/posts");
  },

  getPostById: (id: number) => {
    return axiosRequest.get(`/posts/${id}`);
  },

  updatePost: (id: number, body: PostUpdateRequest) => {
    return axiosRequest.put(`/posts/${id}`, body);
  },

  deletePost: (id: number) => {
    return axiosRequest.delete(`/posts/${id}`);
  },

  getMyPosts: () => {
    return axiosRequest.get("/posts/me");
  },

  joinChatEligibilityBatch: (postIds: number[]) =>
    axiosRequest.post("/posts/join-eligibility/batch", { postIds }),
};
