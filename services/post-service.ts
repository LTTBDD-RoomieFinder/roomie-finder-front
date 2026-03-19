import { postApi } from "@/apis/post-api";
import { PostCreateRequest, PostUpdateRequest } from "@/data/request";
import { PostResponse } from "@/data/response";
import type { PostJoinEligibility } from "@/types/post-join-eligibility";

function unwrapData<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const postService = {
  async createPost(body: PostCreateRequest): Promise<PostResponse> {
    const res = await postApi.createPost(body);
    return (res as any).data as PostResponse;
  },

  async getAllPosts(): Promise<PostResponse[]> {
    const res = await postApi.getAllPosts();
    return (res as any).data as PostResponse[];
  },

  async getPostById(id: number): Promise<PostResponse> {
    const res = await postApi.getPostById(id);
    return (res as any).data as PostResponse;
  },

  async updatePost(id: number, body: PostUpdateRequest): Promise<PostResponse> {
    const res = await postApi.updatePost(id, body);
    return (res as any).data as PostResponse;
  },

  async deletePost(id: number): Promise<void> {
    await postApi.deletePost(id);
  },

  async getMyPosts(): Promise<PostResponse[]> {
    const res = await postApi.getMyPosts();
    return (res as any).data as PostResponse[];
  },

  async getJoinChatEligibilityBatch(
    postIds: number[],
  ): Promise<PostJoinEligibility[]> {
    if (postIds.length === 0) return [];
    const res = await postApi.joinChatEligibilityBatch(postIds);
    return unwrapData<PostJoinEligibility[]>(res);
  },
};
