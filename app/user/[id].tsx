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
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { reviewService } from "@/services/review-service";
import { useProfileAvatarStore } from "@/stores/useProfileAvatarStore";
import { ReviewContext } from "@/types/enums";
import type { ReviewResponse, ReviewSummaryResponse } from "@/types/reputation";

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

function ReviewCard({
  item,
  t,
  locale,
  color,
}: {
  item: ReviewResponse;
  t: (key: string) => string;
  locale: string;
  color: ReturnType<typeof useAppTheme>["color"];
}) {
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
    /* keep raw */
  }

  return (
    <View
      style={[
        styles.reviewCard,
        { borderColor: color.border + "55", backgroundColor: color.card },
      ]}
    >
      <View style={styles.reviewTop}>
        <UserAvatar
          userId={item.reviewerId > 0 ? item.reviewerId : undefined}
          hintUrl={item.reviewerAvatarUrl}
          name={item.reviewerFullName}
          size={44}
          style={styles.reviewerAvatar}
        />
        <View style={{ flex: 1 }}>
          <ThemedText
            type="defaultSemiBold"
            style={{ color: color.text }}
            numberOfLines={1}
          >
            {item.reviewerFullName?.trim() || t("common.user")}
          </ThemedText>
          <View style={styles.reviewMetaRow}>
            <StarRow
              rating={item.rating}
              size={13}
              activeColor="#F5A623"
              mutedColor={color.border}
            />
            <ThemedText style={[styles.reviewDate, { color: color.icon }]}>
              {dateLabel}
            </ThemedText>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.contextChip,
          { backgroundColor: color.primary + "14", borderColor: color.primary + "35" },
        ]}
      >
        <ThemedText style={[styles.contextChipText, { color: color.primary }]}>
          {ctxLabel}
        </ThemedText>
      </View>
      {item.comment?.trim() ? (
        <ThemedText style={[styles.reviewComment, { color: color.textSecondary }]}>
          {item.comment.trim()}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color, radius } = useAppTheme();
  const { t, locale } = useLanguage();
  const setAvatarCache = useProfileAvatarStore((s) => s.setAvatar);

  const idParam = Array.isArray(id) ? id[0] : id;
  const userIdKey = idParam?.trim() ?? "";
  const userIdNum = Number(userIdKey);
  const idValid = userIdKey.length > 0 && Number.isFinite(userIdNum);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);

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

  const displayName =
    profile?.fullName?.trim() ||
    (profile?.username ? `@${profile.username}` : "") ||
    t("common.user");

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
            <View style={{ width: 40 }} />
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
                {profile?.username?.trim() ? (
                  <ThemedText style={[styles.username, { color: color.textSecondary }]}>
                    @{profile.username.trim()}
                  </ThemedText>
                ) : null}
              </View>

              <ThemedText style={[styles.sectionTitle, { color: color.text }]}>
                {t("publicUser.reviewsSection")}
              </ThemedText>

              {summary && summary.totalReviews > 0 ? (
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: color.backgroundSecondary, borderRadius: radius.lg },
                  ]}
                >
                  <View style={styles.summaryRow}>
                    <ThemedText style={[styles.avgBig, { color: color.primary }]}>
                      {summary.averageRating.toFixed(1)}
                    </ThemedText>
                    <View style={{ flex: 1 }}>
                      <StarRow
                        rating={Math.round(summary.averageRating)}
                        size={18}
                        activeColor="#F5A623"
                        mutedColor={color.border}
                      />
                      <ThemedText style={[styles.muted, { color: color.textSecondary, marginTop: 4 }]}>
                        {t("publicUser.reviewCount", { count: summary.totalReviews })}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : (
                <ThemedText style={[styles.emptyReviews, { color: color.textSecondary }]}>
                  {t("publicUser.noReviews")}
                </ThemedText>
              )}

              {summary?.reviews?.length ? (
                <View style={styles.reviewList}>
                  {summary.reviews.map((r) => (
                    <ReviewCard
                      key={r.id}
                      item={r}
                      t={t}
                      locale={locale}
                      color={color}
                    />
                  ))}
                </View>
              ) : null}
            </ScrollView>
          )}
        </ThemedView>
      </SafeAreaView>
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
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  summaryCard: { padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avgBig: { fontSize: 36, fontWeight: "800", minWidth: 56 },
  emptyReviews: { fontSize: 14, marginBottom: 8 },
  reviewList: { gap: 12 },
  reviewCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  reviewTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  reviewDate: { fontSize: 12 },
  contextChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contextChipText: { fontSize: 12, fontWeight: "700" },
  reviewComment: { fontSize: 14, lineHeight: 20 },
  starRow: { flexDirection: "row", gap: 2, alignItems: "center" },
});
