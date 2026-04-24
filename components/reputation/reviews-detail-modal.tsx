import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ReviewListItem } from "@/components/reputation/review-list-item";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import type { ReviewSummaryResponse } from "@/types/reputation";

type Props = {
  visible: boolean;
  onClose: () => void;
  memberName: string;
  memberUserId: string;
  summary: ReviewSummaryResponse | null;
  /** Khi mở từ hồ sơ, ẩn nút tới cùng hồ sơ. */
  hideProfileCta?: boolean;
  /** Từ bài đăng chưa biết tên hiển thị — dùng tiêu đề trung tính. */
  useGenericTitle?: boolean;
};

function StarRowBig({
  rating,
  activeColor,
  mutedColor,
}: {
  rating: number;
  activeColor: string;
  mutedColor: string;
}) {
  const r = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= r ? "star" : "star-outline"}
          size={24}
          color={i <= r ? activeColor : mutedColor}
        />
      ))}
    </View>
  );
}

const STAR = "#E8A23C";

/**
 * Toàn bộ danh sách đánh giá — mở từ thẻ trên bài đăng hoặc từ hồ sơ công khai.
 */
export function ReviewsDetailModal({
  visible,
  onClose,
  memberName,
  memberUserId,
  summary,
  hideProfileCta = false,
  useGenericTitle = false,
}: Props) {
  const { color, radius } = useAppTheme();
  const { t, locale } = useLanguage();
  const insets = useSafeAreaInsets();

  const reviews = summary?.reviews ?? [];
  const avg = summary?.averageRating ?? 0;
  const total = summary?.totalReviews ?? 0;
  const avgLabel = total > 0 && avg > 0 ? avg.toFixed(1) : "—";
  const display = memberName.trim() || t("common.user");
  const headerTitle = useGenericTitle
    ? t("review.modalTitleGeneric")
    : t("review.modalTitle", { name: display });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          { backgroundColor: color.background, paddingTop: insets.top },
        ]}
      >
        <View
          style={[
            styles.topBar,
            { borderBottomColor: color.border + "80" },
          ]}
        >
          <Pressable onPress={onClose} style={styles.topBarBtn} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={26} color={color.text} />
          </Pressable>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.topTitle, { color: color.text }]}
            numberOfLines={2}
          >
            {headerTitle}
          </ThemedText>
          <View style={styles.topBarBtn} />
        </View>

        <FlatList
          style={styles.list}
          data={reviews}
          keyExtractor={(r) => String(r.id)}
          removeClippedSubviews={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 32, flexGrow: 1 },
          ]}
          ListHeaderComponent={
            <View
              style={[
                styles.hero,
                { backgroundColor: color.card, borderColor: color.border, borderRadius: radius.lg },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: color.primary + "16" }]}>
                <Ionicons name="shield-checkmark" size={32} color={color.primary} />
              </View>
              <ThemedText style={[styles.lead, { color: color.text }]}>
                {t("review.modalLead")}
              </ThemedText>
              {total > 0 ? (
                <View style={styles.scoreBlock}>
                  <ThemedText style={[styles.bigScore, { color: color.text }]}>{avgLabel}</ThemedText>
                  <View style={styles.scoreRight}>
                    <StarRowBig rating={avg} activeColor={STAR} mutedColor={color.border} />
                    <ThemedText style={[styles.reviewCount, { color: color.textSecondary }]}>
                      {t("publicUser.reviewCount", { count: total })}
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <ThemedText style={[styles.empty, { color: color.textSecondary }]}>
                  {t("publicUser.noReviews")}
                </ThemedText>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ReviewListItem item={item} t={t} locale={locale} variant="default" />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={null}
        />

        {hideProfileCta ? null : (
          <View
            style={[
              styles.footer,
              {
                borderTopColor: color.border + "80",
                paddingBottom: insets.bottom + 12,
                backgroundColor: color.background,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                onClose();
                router.push({ pathname: "/user/[id]", params: { id: memberUserId } });
              }}
              style={({ pressed }) => [
                styles.profileBtn,
                {
                  backgroundColor: pressed ? color.primary + "20" : color.primary + "12",
                  borderRadius: radius.lg,
                  borderColor: color.primary + "45",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("review.viewMemberProfile")}
            >
              <Ionicons name="person-circle-outline" size={22} color={color.primary} />
              <ThemedText style={[styles.profileBtnText, { color: color.primary }]}>
                {t("review.viewMemberProfile")}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color={color.primary} />
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: 19, fontWeight: "700" },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 0 },
  hero: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  lead: {
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    marginBottom: 18,
    alignSelf: "stretch",
  },
  scoreBlock: { flexDirection: "row", alignItems: "center", gap: 18 },
  bigScore: { fontSize: 44, fontWeight: "800" },
  scoreRight: { gap: 8 },
  starsRow: { flexDirection: "row", gap: 4 },
  reviewCount: { fontSize: 16, fontWeight: "600" },
  empty: { fontSize: 16, lineHeight: 24 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 14 },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  profileBtnText: { flex: 1, fontSize: 17, fontWeight: "800" },
});
