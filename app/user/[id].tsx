import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { profileApi } from "@/apis/profile";
import { ThemedText } from "@/components/themed-text";
import {
  formatPublicDisplayName,
  humanizeLoginHandle,
  isNumericUserIdParam,
} from "@/utils/display-name";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ReportTriggerButton, SubmitReportModal } from "@/components/report/submit-report-modal";
import { ReviewListItem } from "@/components/reputation/review-list-item";
import { ReviewsDetailModal } from "@/components/reputation/reviews-detail-modal";
import { WriteReviewModal } from "@/components/reputation/write-review-modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { reviewService } from "@/services/review-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileAvatarStore } from "@/stores/useProfileAvatarStore";
import { ReportTargetType } from "@/types/enums";
import type { ReviewSummaryResponse } from "@/types/reputation";

type PublicProfile = {
  fullName: string;
  username: string;
  avatarUrl: string | null;
};

function parsePublicProfile(res: unknown): PublicProfile {
  const body = res as Record<string, unknown>;
  const data = (body?.data ?? body) as Record<string, unknown>;
  const fullName =
    (typeof data.fullName === "string" && data.fullName.trim()) ||
    (typeof data.full_name === "string" && data.full_name.trim()) ||
    "";
  const username =
    (typeof data.username === "string" && data.username.trim()) ||
    (typeof data.user_name === "string" && data.user_name.trim()) ||
    "";
  const avatarUrl =
    typeof data.avatarUrl === "string" && data.avatarUrl.trim()
      ? data.avatarUrl.trim()
      : typeof data.avatar_url === "string" && data.avatar_url.trim()
        ? data.avatar_url.trim()
        : null;
  return { fullName, username, avatarUrl };
}

function StarRow({
  rating,
  size = 14,
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

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color, radius } = useAppTheme();
  const { t, locale } = useLanguage();
  const authUser = useAuthStore((s) => s.user);
  const setAvatarCache = useProfileAvatarStore((s) => s.setAvatar);

  const idParam = Array.isArray(id) ? id[0] : id;
  const userIdKey = idParam?.trim() ?? "";
  const idValid = userIdKey.length > 0;
  const revieweeNumericId = isNumericUserIdParam(userIdKey) ? parseInt(userIdKey, 10) : 0;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewsDetailOpen, setReviewsDetailOpen] = useState(false);

  const load = useCallback(async () => {
    if (!idValid) {
      setError(t("publicUser.invalidUser"));
      setLoading(false);
      setProfile(null);
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [profRes, reviewSummary] = await Promise.all([
        profileApi.getUserProfile(userIdKey),
        reviewService.getSummaryByUserId(userIdKey),
      ]);
      const p = parsePublicProfile(profRes);
      setProfile(p);
      setSummary(reviewSummary);
      setAvatarCache(userIdKey, p.avatarUrl);
    } catch (e) {
      setProfile(null);
      setSummary(null);
      setError(typeof e === "string" ? e : t("publicUser.loadError"));
    } finally {
      setLoading(false);
    }
  }, [idValid, userIdKey, setAvatarCache, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName = profile
    ? formatPublicDisplayName(profile.fullName, profile.username, t("common.user"))
    : t("common.user");

  const isOwnProfile =
    authUser?.id != null && String(authUser.id) === userIdKey;
  const canWriteReview = Boolean(
    authUser &&
      profile &&
      !isOwnProfile &&
      idValid &&
      revieweeNumericId > 0,
  );
  const showLoginToReview = Boolean(!authUser && profile && !loading && !error);
  const canReportThisUser = Boolean(
    authUser &&
      !isOwnProfile &&
      profile &&
      !loading &&
      !error &&
      revieweeNumericId > 0,
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: color.background }} edges={["top"]}>
        <ThemedView style={[styles.root, { backgroundColor: color.background }]}>
          <View style={[styles.header, { borderBottomColor: color.border + "60" }]}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={12}
              accessibilityRole="button"
            >
              <IconSymbol name="chevron.left" size={24} color={color.primary} />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: color.text }]} numberOfLines={1}>
              {t("publicUser.title")}
            </ThemedText>
            <View style={styles.headerRightSlot}>
              {canReportThisUser ? (
                <ReportTriggerButton
                  onPress={() => setReportOpen(true)}
                  accessibilityLabel={t("report.a11yOpen")}
                />
              ) : (
                <View style={{ width: 34 }} />
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={color.primary} />
              <ThemedText style={[styles.muted, { color: color.textSecondary, marginTop: 12 }]}>
                {t("common.loading")}
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <ThemedText style={{ color: color.error, textAlign: "center", marginBottom: 12 }}>
                {error}
              </ThemedText>
              <Pressable
                onPress={() => void load()}
                style={[styles.retryBtn, { borderColor: color.primary }]}
              >
                <ThemedText style={{ color: color.primary, fontWeight: "700" }}>
                  {t("common.retry")}
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.hero,
                  { backgroundColor: color.card, borderRadius: radius.lg, borderColor: color.border },
                ]}
              >
                <UserAvatar
                  userId={userIdKey}
                  hintUrl={profile?.avatarUrl}
                  name={displayName}
                  size={96}
                  style={styles.heroAvatar}
                />
                <ThemedText type="title" style={[styles.name, { color: color.text }]}>
                  {displayName}
                </ThemedText>
                {profile?.username?.trim() && profile.fullName?.trim() ? (
                  <ThemedText style={[styles.username, { color: color.textSecondary }]}>
                    @{humanizeLoginHandle(profile.username)}
                  </ThemedText>
                ) : null}

                {summary != null && summary.totalReviews > 0 ? (
                  <View
                    style={[
                      styles.heroReviewBadge,
                      { backgroundColor: color.backgroundSecondary, borderColor: color.border },
                    ]}
                  >
                    <StarRow
                      rating={Math.round(summary.averageRating)}
                      size={15}
                      activeColor="#E8A23C"
                      mutedColor={color.border}
                    />
                    <ThemedText type="defaultSemiBold" style={{ color: color.text, fontSize: 16 }}>
                      {summary.averageRating.toFixed(1)}
                    </ThemedText>
                    <ThemedText style={[styles.heroReviewMeta, { color: color.textSecondary }]}>
                      · {t("publicUser.reviewCount", { count: summary.totalReviews })}
                    </ThemedText>
                  </View>
                ) : profile ? (
                  <ThemedText style={[styles.heroNoReviews, { color: color.textSecondary }]}>
                    {t("publicUser.noReviews")}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.reviewsHeaderRow}>
                <ThemedText style={[styles.sectionTitle, { color: color.text, marginBottom: 0, flex: 1 }]}>
                  {t("publicUser.reviewsSection")}
                </ThemedText>
                {summary && summary.totalReviews > 0 ? (
                  <Pressable
                    onPress={() => setReviewsDetailOpen(true)}
                    hitSlop={10}
                    style={({ pressed }) => [styles.reviewsExpandBtn, pressed && { opacity: 0.75 }]}
                    accessibilityRole="button"
                    accessibilityLabel={t("publicUser.reviewsOpenExpandedA11y")}
                  >
                    <Ionicons name="albums-outline" size={20} color={color.primary} />
                    <ThemedText style={[styles.reviewsExpandText, { color: color.primary }]}>
                      {t("publicUser.reviewsOpenExpanded")}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <ThemedText style={[styles.reviewsSectionLead, { color: color.textSecondary }]}>
                {t("publicUser.reviewsSectionLead")}
              </ThemedText>

              {canWriteReview ? (
                <Pressable
                  onPress={() => setWriteReviewOpen(true)}
                  style={({ pressed }) => [
                    styles.writeCta,
                    {
                      borderColor: color.primary + "45",
                      backgroundColor: pressed
                        ? color.primary + "22"
                        : color.primary + "12",
                      borderRadius: radius.lg,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t("publicUser.writeReview.cta")}
                >
                  <Ionicons name="create-outline" size={22} color={color.primary} />
                  <ThemedText style={[styles.writeCtaText, { color: color.primary }]}>
                    {t("publicUser.writeReview.cta")}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={color.primary} />
                </Pressable>
              ) : showLoginToReview && !isOwnProfile ? (
                <Pressable
                  onPress={() => router.push("/(auth)/login")}
                  style={({ pressed }) => [
                    styles.writeCta,
                    {
                      borderColor: color.border,
                      backgroundColor: pressed
                        ? color.backgroundSecondary
                        : color.card,
                      borderRadius: radius.lg,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name="log-in-outline" size={22} color={color.primary} />
                  <ThemedText style={[styles.writeCtaText, { color: color.text }]}>
                    {t("publicUser.writeReview.loginCta")}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color={color.icon} />
                </Pressable>
              ) : null}

              {summary?.reviews?.length ? (
                <View style={styles.reviewList}>
                  {summary.reviews.map((r) => (
                    <ReviewListItem key={r.id} item={r} t={t} locale={locale} />
                  ))}
                </View>
              ) : null}
            </ScrollView>
          )}
        </ThemedView>
      </SafeAreaView>

      <WriteReviewModal
        visible={writeReviewOpen}
        onClose={() => setWriteReviewOpen(false)}
        revieweeId={revieweeNumericId}
        revieweeName={displayName}
        onSuccess={() => void load()}
      />

      <SubmitReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={ReportTargetType.USER}
        targetId={revieweeNumericId}
        contextLabel={displayName}
        onSubmitted={() => void load()}
      />

      <ReviewsDetailModal
        visible={reviewsDetailOpen}
        onClose={() => setReviewsDetailOpen(false)}
        memberName={displayName}
        memberUserId={userIdKey}
        summary={summary}
        hideProfileCta
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800" },
  headerRightSlot: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { fontSize: 14 },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
  },
  name: { fontSize: 22, textAlign: "center" },
  username: { fontSize: 14, marginTop: 4 },
  heroReviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroReviewMeta: { fontSize: 14, fontWeight: "600" },
  heroNoReviews: { fontSize: 13, marginTop: 12, textAlign: "center" },
  reviewsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  reviewsSectionLead: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  reviewsExpandBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  reviewsExpandText: { fontSize: 13, fontWeight: "800" },
  writeCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  writeCtaText: { flex: 1, fontSize: 15, fontWeight: "800" },
  reviewList: { gap: 12 },
  starRow: { flexDirection: "row", gap: 2, alignItems: "center" },
});
