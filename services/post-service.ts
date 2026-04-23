import { postApi } from "@/apis/post-api";
import { PostCreateRequest, PostUpdateRequest } from "@/data/request";
import { PostResponse } from "@/data/response";
import type { PostJoinEligibility } from "@/types/post-join-eligibility";
import {
  normalizePostResponse,
  unwrapPostPayload,
} from "@/utils/normalize-post";

function unwrapData<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

function normalizePostFromApi(res: unknown): PostResponse {
  return normalizePostResponse(unwrapPostPayload(res));
}

export const postService = {
  async createPost(body: PostCreateRequest): Promise<PostResponse> {
    const res = await postApi.createPost(body);
    return normalizePostFromApi(res);
  },

  async getAllPosts(): Promise<PostResponse[]> {
    const res = await postApi.getAllPosts();
    const raw = unwrapPostPayload(res);
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => normalizePostResponse(p));
  },

  async getPostById(id: number): Promise<PostResponse> {
    const res = await postApi.getPostById(id);
    return normalizePostFromApi(res);
  },

  async updatePost(id: number, body: PostUpdateRequest): Promise<PostResponse> {
    const res = await postApi.updatePost(id, body);
    return normalizePostFromApi(res);
  },

  async deletePost(id: number): Promise<void> {
    await postApi.deletePost(id);
  },

  async getMyPosts(): Promise<PostResponse[]> {
    const res = await postApi.getMyPosts();
    const raw = unwrapPostPayload(res);
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => normalizePostResponse(p));
  },

  async getJoinChatEligibilityBatch(
    postIds: number[],
  ): Promise<PostJoinEligibility[]> {
    if (postIds.length === 0) return [];
    const res = await postApi.joinChatEligibilityBatch(postIds);
    return unwrapData<PostJoinEligibility[]>(res);
  },
};
