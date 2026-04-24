import { PostStatus } from "@/types/PostStatus";

export const STATUS_OPTIONS: { value: PostStatus; labelKey: string }[] = [
  { value: "PUBLISHED", labelKey: "post.statusOption.published" },
  { value: "HIDDEN", labelKey: "post.statusOption.hidden" },
  { value: "DRAFT", labelKey: "post.statusOption.draft" },
];

export const STATUS_COLORS: Record<PostStatus, string> = {
  PUBLISHED: "#4ade80",
  DRAFT: "#facc15",
  HIDDEN: "#94a3b8",
  EXPIRED: "#f87171",
};
