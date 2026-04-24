export type LifestyleTagType = "match" | "conflict" | "neutral";

export type LifestyleTag = {
  id: string;
  label: string;
  type: LifestyleTagType;
};

export type SmartMatchProfile = {
  id: string;
  name: string;
  /** API không gửi → null, UI ẩn tuổi. */
  age: number | null;
  /** Dòng phụ (ví dụ: trust + nhãn gợi ý từ backend). */
  subtitle: string;
  imageUrl: string | null;
  matchPercent: number;
  verified: boolean;
  tags: LifestyleTag[];
};
