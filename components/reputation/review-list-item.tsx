import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ReviewContext } from "@/types/enums";
import type { ReviewResponse } from "@/types/reputation";

function StarRow({
  rating,
  size = 13,
  activeColor,
  mutedColor,
}: {
  rating: number;
  size?: number;
  activeColor: string;
  mutedColor: string;
}) {
  const r = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= r ? "star" : "star-outline"}
          size={size}
          color={i <= r ? activeColor : mutedColor}
        />
      ))}
    </View>
  );
}

const STAR = "#E8A23C";

type Props = {
  item: ReviewResponse;
  t: (key: string) => string;
  locale: string;
  variant?: "default" | "compact";
};

/**
 * One review block — dùng chung hồ sơ công khai và modal “xem tất cả” đánh giá.
 */
export function ReviewListItem({ item, t, locale, variant = "default" }: Props) {
  const { color, radius } = useAppTheme();
  const compact = variant === "compact";
  const avatarSize = compact ? 40 : 46;

  const ctxKey =
    item.context === ReviewContext.LANDLORD_EXPERIENCE
      ? "publicUser.reviewContext.LANDLORD_EXPERIENCE"
      : "publicUser.reviewContext.ROOMMATE_EXPERIENCE";
  const ctxLabel = t(ctxKey);
  let dateLabel = item.createdAt;
  try {
    dateLabel = new Date(item.createdAt.replace(" ", "T")).toLocaleDateString(
      locale === "vi" ? "vi-VN" : "en-US",
      { day: "2-digit", month: "short", year: "numeric" },
    );
  } catch {
    /* keep */
  }

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        {
          borderColor: color.border + "60",
          backgroundColor: color.card,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.top}>
        <UserAvatar
          userId={item.reviewerId > 0 ? item.reviewerId : undefined}
          hintUrl={item.reviewerAvatarUrl}
          name={item.reviewerFullName}
          size={avatarSize}
          style={[
            styles.avatar,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          ]}
        />
        <View style={styles.nameCol}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.name, { color: color.text }]}
            numberOfLines={1}
          >
            {item.reviewerFullName?.trim() || t("common.user")}
          </ThemedText>
          <View style={styles.metaRow}>
            <StarRow
              rating={item.rating}
              size={compact ? 12 : 13}
              activeColor={STAR}
              mutedColor={color.border}
            />
            <ThemedText style={[styles.date, { color: color.textSecondary }]}>{dateLabel}</ThemedText>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.chip,
          { backgroundColor: color.primary + "12", borderColor: color.primary + "40" },
        ]}
      >
        <ThemedText style={[styles.chipText, { color: color.primary }]} numberOfLines={1}>
          {ctxLabel}
        </ThemedText>
      </View>
      {item.comment?.trim() ? (
        <ThemedText
          style={[
            styles.comment,
            { color: color.textSecondary },
            compact && styles.commentCompact,
          ]}
        >
          {item.comment.trim()}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  starRow: { flexDirection: "row", gap: 2, alignItems: "center" },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  cardCompact: { padding: 12, gap: 8 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { alignItems: "center", justifyContent: "center" },
  nameCol: { flex: 1, minWidth: 0 },
  name: { fontSize: 16 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  date: { fontSize: 12 },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 12, fontWeight: "700" },
  comment: { fontSize: 15, lineHeight: 22 },
  commentCompact: { fontSize: 14, lineHeight: 20 },
});
