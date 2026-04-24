import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ReviewsDetailModal } from "@/components/reputation/reviews-detail-modal";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { usePosterReviewSummary } from "@/hooks/use-poster-review-summary";

function StarRow({
  rating,
  size = 11,
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
  posterUserId: string;
};

/**
 * Dòng điểm tin cậy người đăng (feed): gọn một hàng, bấm mở modal đánh giá hoặc hồ sơ.
 */
export function PostPosterReviews({ posterUserId }: Props) {
  const { color, radius } = useAppTheme();
  const { t } = useLanguage();
  const { loading, summary } = usePosterReviewSummary(posterUserId);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return null;
  }

  const goProfile = () => {
    router.push({
      pathname: "/user/[id]",
      params: { id: posterUserId },
    });
  };

  const baseBar = [
    styles.bar,
    {
      borderRadius: radius.md,
      borderColor: color.border + "66",
      backgroundColor: color.backgroundSecondary,
    },
  ] as const;

  if (!summary || summary.totalReviews <= 0) {
    return (
      <Pressable
        onPress={goProfile}
        style={({ pressed }) => [...baseBar, pressed && { opacity: 0.88 }]}
        accessibilityRole="button"
        accessibilityLabel={t("postCard.posterTrustEmptyA11y")}
      >
        <View style={[styles.leadIcon, { backgroundColor: color.primary + "14" }]}>
          <Ionicons name="shield-outline" size={18} color={color.primary} />
        </View>
        <View style={styles.barTextCol}>
          <ThemedText type="defaultSemiBold" style={[styles.leadTitle, { color: color.text }]} numberOfLines={1}>
            {t("postCard.posterTrustCompactTitle")}
          </ThemedText>
          <ThemedText style={[styles.leadSub, { color: color.textSecondary }]} numberOfLines={1}>
            {t("postCard.posterTrustCompactEmpty")}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={color.textSecondary} />
      </Pressable>
    );
  }

  const avg = summary.averageRating;
  const avgLabel = avg > 0 ? avg.toFixed(1) : "—";

  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        style={({ pressed }) => [...baseBar, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={t("postCard.posterOpenReviewsA11y")}
      >
        <View style={[styles.leadIcon, { backgroundColor: color.primary + "14" }]}>
          <Ionicons name="shield-checkmark" size={18} color={color.primary} />
        </View>
        <View style={styles.barMain}>
          <View style={styles.barTopLine}>
            <ThemedText type="defaultSemiBold" style={[styles.trustLabel, { color: color.textSecondary }]}>
              {t("postCard.posterTrustCompactTitle")}
            </ThemedText>
          </View>
          <View style={styles.scoreLine}>
            <ThemedText style={[styles.scoreNum, { color: color.text }]}>{avgLabel}</ThemedText>
            <StarRow rating={avg} size={14} activeColor={STAR} mutedColor={color.border} />
            <View style={[styles.dot, { backgroundColor: color.textSecondary }]} />
            <ThemedText style={[styles.reviewCount, { color: color.textSecondary }]}>
              {t("publicUser.reviewCount", { count: summary.totalReviews })}
            </ThemedText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={color.primary} style={styles.openChevron} />
      </Pressable>

      <ReviewsDetailModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        memberName=""
        memberUserId={posterUserId}
        summary={summary}
        useGenericTitle
      />
    </>
  );
}

const styles = StyleSheet.create({
  starRow: { flexDirection: "row", gap: 1, alignItems: "center" },
  bar: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  leadIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  barTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  barMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  barTopLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  trustLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  leadTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  leadSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  scoreLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  scoreNum: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  openChevron: { marginLeft: 2 },
});
