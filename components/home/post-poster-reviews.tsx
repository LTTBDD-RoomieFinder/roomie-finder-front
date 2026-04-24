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
  size = 12,
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
 * Thẻ “tin cậy” trên bài đăng: tóm tắt + mở modal xem toàn bộ (không nhét cả bình luận dài trên feed).
 */
export function PostPosterReviews({ posterUserId }: Props) {
  const { color, radius } = useAppTheme();
  const { t } = useLanguage();
  const { loading, summary } = usePosterReviewSummary(posterUserId);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (!summary || summary.totalReviews <= 0) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/user/[id]",
            params: { id: posterUserId },
          })
        }
        style={({ pressed }) => [
          styles.emptyRow,
          { backgroundColor: color.card, borderColor: color.border + "80" },
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("publicUser.openProfileA11y")}
      >
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: color.primary + "12", borderColor: color.primary + "30" },
          ]}
        >
          <Ionicons name="shield-outline" size={20} color={color.primary} />
        </View>
        <View style={styles.emptyBody}>
          <ThemedText type="defaultSemiBold" style={[styles.emptyTitle, { color: color.text }]}>
            {t("postCard.posterTrustEmptyTitle")}
          </ThemedText>
          <ThemedText style={[styles.emptySub, { color: color.textSecondary }]} numberOfLines={2}>
            {t("postCard.posterTrustEmptySub")}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={color.textSecondary} />
      </Pressable>
    );
  }

  const avg = summary.averageRating;
  const avgLabel = avg > 0 ? avg.toFixed(1) : "—";
  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: color.primary + "28",
            backgroundColor: color.card,
            borderRadius: radius.lg,
            shadowColor: color.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 2,
          },
          pressed && { opacity: 0.95 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("postCard.posterOpenReviewsA11y")}
      >
        <View style={styles.cardInner}>
          <View
            style={[
              styles.eyebrowRow,
              { backgroundColor: color.primary + "10", borderRadius: radius.lg - 2 },
            ]}
          >
            <Ionicons name="shield-checkmark" size={16} color={color.primary} />
            <ThemedText
              type="defaultSemiBold"
              style={[styles.eyebrow, { color: color.primary }]}
              numberOfLines={1}
            >
              {t("postCard.posterTrustEyebrow")}
            </ThemedText>
          </View>
          <ThemedText style={[styles.tagline, { color: color.textSecondary }]} numberOfLines={2}>
            {t("postCard.posterTrustTagline")}
          </ThemedText>
          <View style={styles.scoreRow}>
            <ThemedText style={[styles.bigScore, { color: color.text }]}>{avgLabel}</ThemedText>
            <View style={styles.scoreMid}>
              <StarRow
                rating={avg}
                size={16}
                activeColor={STAR}
                mutedColor={color.border}
              />
              <ThemedText style={[styles.count, { color: color.textSecondary }]}>
                {t("publicUser.reviewCount", { count: summary.totalReviews })}
              </ThemedText>
            </View>
            <View style={styles.openHint}>
              <ThemedText style={[styles.openHintText, { color: color.primary }]}>
                {t("postCard.posterOpenReviews")}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color={color.primary} />
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/user/[id]",
            params: { id: posterUserId },
          })
        }
        style={({ pressed }) => [styles.profileLink, pressed && { opacity: 0.8 }]}
        hitSlop={6}
        accessibilityRole="link"
        accessibilityLabel={t("publicUser.openProfileA11y")}
      >
        <Ionicons name="person-circle-outline" size={16} color={color.textSecondary} />
        <ThemedText style={[styles.profileLinkText, { color: color.textSecondary }]}>
          {t("postCard.posterViewProfileLink")}
        </ThemedText>
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
  card: {
    marginTop: 10,
    marginBottom: 2,
    marginHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardInner: { padding: 14, gap: 8 },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  eyebrow: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 },
  tagline: { fontSize: 13, lineHeight: 19 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  bigScore: { fontSize: 32, fontWeight: "800" },
  scoreMid: { flex: 1, gap: 2 },
  count: { fontSize: 13, fontWeight: "600" },
  openHint: { flexDirection: "row", alignItems: "center", gap: 2 },
  openHintText: { fontSize: 14, fontWeight: "800" },
  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 4,
  },
  profileLinkText: { fontSize: 13, fontWeight: "600" },
  emptyRow: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyBody: { flex: 1, minWidth: 0, gap: 2 },
  emptyTitle: { fontSize: 15 },
  emptySub: { fontSize: 12, lineHeight: 16 },
});
