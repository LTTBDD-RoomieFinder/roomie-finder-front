import type { GenderRequirement, RoomType } from "@/types/enums";
import type { RequestStatus } from "@/types/request";
import type { PostStatus } from "@/types/PostStatus";

/** Translation key for room type (matches `room.type.*` in locales). */
export function roomTypeLabelKey(rt: RoomType): string {
  return `room.type.${rt}`;
}

/** Translation key for gender requirement filter. */
export function genderReqLabelKey(g: GenderRequirement): string {
  return `room.genderRequirement.${g}`;
}

/** Translation key for request status. */
export function requestStatusLabelKey(s: RequestStatus): string {
  return `request.status.${s}`;
}

/** Translation key for post listing status badge. */
export function postStatusLabelKey(s: PostStatus): string {
  return `post.status.${s}`;
}
