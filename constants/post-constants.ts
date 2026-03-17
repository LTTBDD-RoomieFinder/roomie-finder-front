import { PostStatus } from "@/types/PostStatus";

export const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "PUBLISHED", label: "Công khai" },
  { value: "HIDDEN", label: "Riêng tư" },
  { value: "DRAFT", label: "Bản nháp" },
];

export const STATUS_LABELS: Record<PostStatus, string> = {
  PUBLISHED: "Công khai",
  DRAFT: "Bản nháp",
  HIDDEN: "Riêng tư",
  EXPIRED: "Hết hạn",
};

export const STATUS_COLORS: Record<PostStatus, string> = {
  PUBLISHED: "#4ade80",
  DRAFT: "#facc15",
  HIDDEN: "#94a3b8",
  EXPIRED: "#f87171",
};