import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { type Href, router } from "expo-router";

import { PostPosterReviews } from "@/components/home/post-poster-reviews";
import { PostRequestChatIcon } from "@/components/post/post-request-chat-icon";
import { ReportTriggerButton, SubmitReportModal } from "@/components/report/submit-report-modal";
import { ThemedText } from "@/components/themed-text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { usePostsJoinEligibility } from "@/hooks/use-posts-join-eligibility";
import { postStatusLabelKey } from "@/lib/i18n-labels";
import { formatDate } from "@/utils/format-post";
import { ReportTargetType } from "@/types/enums";
import { formatRoomPrice } from "@/utils/format-room";

type Props = {
  post: PostResponse;
  currentUserId?: number | string;
  onEdit?: (post: PostResponse) => void;
  onDelete?: (post: PostResponse) => void;
};

export function PostCard({ post, currentUserId, onEdit, onDelete }: Props) {
  const { color, radius } = useAppTheme();
  const { t, locale } = useLanguage();
  const { width } = useWindowDimensions();
  const isOwner = currentUserId !== undefined && String(post.user.id) === String(currentUserId);
  const myUserIdNumber =
    currentUserId === undefined ? undefined : Number(currentUserId);

  // Eligibility cho icon request chat (xếp hàng khi full).
  const {
    eligibilityByPostId,
    loading: eligLoading,
    error: eligError,
    refresh: refreshElig,
  } = usePostsJoinEligibility([post.id], Boolean(myUserIdNumber && !isOwner));
  const elig = eligibilityByPostId[post.id];
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <View style={[styles.card]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            {
              flexDirection: "row",
              flex: 1,
              minWidth: 0,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => {
            const uid = String(post.user.id ?? "").trim();
            if (!uid) return;
            router.push({
              pathname: "/user/[id]",
              params: { id: uid },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel={t("postCard.openPosterProfileA11y", {
            name: post.user.fullName || post.user.username,
          })}
        >
          <UserAvatar
            userId={post.user.id}
            hintUrl={post.user.avatarUrl}
            name={post.user.fullName || post.user.username}
            size={52}
            style={[styles.avatar, { backgroundColor: color.backgroundSecondary }]}
          />
          <View style={styles.nameBlock}>
            <ThemedText type="defaultSemiBold" style={styles.userName} numberOfLines={1}>
              {post.user.fullName || post.user.username}
            </ThemedText>
          </View>
        </Pressable>
      </View>

      {/* Một hàng: ngày + trạng thái bài (công khai/bản nháp…) | báo cáo hoặc sửa/xóa */}
      <View style={styles.postToolbar}>
        <View style={styles.postToolbarLeft}>
          <ThemedText style={[styles.metaText, { color: color.textSecondary }]}>
            {formatDate(post.createdAt)}
          </ThemedText>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: color.backgroundSecondary, borderColor: color.border + "80" },
            ]}
          >
            <Ionicons
              name={post.status === "PUBLISHED" ? "earth" : post.status === "DRAFT" ? "document-text" : "eye-off"}
              size={14}
              color={color.textSecondary}
            />
            <ThemedText style={[styles.statusPillText, { color: color.textSecondary }]} numberOfLines={1}>
              {t(postStatusLabelKey(post.status))}
            </ThemedText>
          </View>
        </View>
        <View style={styles.postToolbarRight}>
          {isOwner ? (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.ownerActionPill,
                  {
                    backgroundColor: pressed ? color.backgroundSecondary : color.card,
                    borderColor: color.border,
                  },
                ]}
                onPress={() => onEdit?.(post)}
                accessibilityLabel={t("postCard.a11yEditPost")}
              >
                <Ionicons name="create-outline" size={20} color={color.primary} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.ownerActionPill,
                  {
                    backgroundColor: pressed ? color.error + "18" : color.card,
                    borderColor: color.error + "50",
                  },
                ]}
                onPress={() => onDelete?.(post)}
                accessibilityLabel={t("postCard.a11yDeletePost")}
              >
                <Ionicons name="trash-outline" size={20} color={color.error} />
              </Pressable>
            </>
          ) : (
            <ReportTriggerButton
              onPress={() => {
                if (currentUserId === undefined || currentUserId === null || currentUserId === "") {
                  Alert.alert(t("report.loginRequiredTitle"), t("report.loginRequiredMsg"), [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                      text: t("publicUser.writeReview.loginCta"),
                      onPress: () => router.push("/(auth)/login" as Href),
                    },
                  ]);
                  return;
                }
                setReportOpen(true);
              }}
              accessibilityLabel={t("report.a11yOpen")}
            />
          )}
        </View>
      </View>

      <SubmitReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={ReportTargetType.POST}
        targetId={post.id}
        contextLabel={post.title}
      />

      <View>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.title, { color: color.text, paddingHorizontal: 16 }]}
          numberOfLines={4}
        >
          {post.title}
        </ThemedText>
        <ThemedText style={[styles.content, { color: color.text }]} numberOfLines={5}>
          {post.content}
        </ThemedText>
      </View>

      {String(post.user.id ?? "").trim() !== "" ? (
        <PostPosterReviews posterUserId={String(post.user.id).trim()} />
      ) : null}

      {post.room && (
        <View style={[styles.roomAttachment, { backgroundColor: color.backgroundSecondary }]}>
          {post.room.imageUrls && post.room.imageUrls.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {post.room.imageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={[styles.roomImage, { width }]}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              source={require("@/assets/images/placeholder.png")}
              style={[styles.roomImage, { width }]}
              contentFit="cover"
            />
          )}

          <View style={styles.roomInfo}>
            <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.roomTitle}>
              {post.room.title}
            </ThemedText>

            <View style={styles.roomMetaRow}>
              <ThemedText style={[styles.roomPrice, { color: color.tint }]}>
                {formatRoomPrice(post.room.price, t, locale)}
              </ThemedText>
              <ThemedText style={{ color: color.textSecondary, fontSize: 13, marginHorizontal: 6 }}>•</ThemedText>
              <ThemedText style={{ color: color.textSecondary, fontSize: 13 }}>
                {post.room.area}m²
              </ThemedText>
              <ThemedText style={{ color: color.textSecondary, fontSize: 13, marginHorizontal: 6 }}>•</ThemedText>
              <ThemedText style={{ color: color.textSecondary, fontSize: 13 }}>
                {t("postCard.maxPeople", { count: post.room.capacity })}
              </ThemedText>
            </View>

            <View style={styles.roomAddressRow}>
              <Ionicons name="location" size={14} color={color.textSecondary} />
              <ThemedText style={{ color: color.textSecondary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {post.room.address.district}, {post.room.address.city}
              </ThemedText>
            </View>

            {!isOwner ? (
              <View style={styles.roomCtaRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.btnPrimaryCta,
                    {
                      backgroundColor: color.primary,
                      borderRadius: radius.md,
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: color.primary,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/room/[id]",
                      params: { id: post.room.id, from: "home" },
                    })
                  }
                >
                  <Ionicons name="home-outline" size={20} color={color.primaryText} />
                  <ThemedText
                    style={[styles.btnPrimaryCtaText, { color: color.primaryText }]}
                    numberOfLines={1}
                  >
                    {t("postCard.viewRoom")}
                  </ThemedText>
                </Pressable>
                <PostRequestChatIcon
                  post={post}
                  currentUserId={currentUserId}
                  eligibility={elig}
                  eligibilityLoading={eligLoading}
                  eligibilityError={eligError}
                  onRetryEligibility={refreshElig}
                  variant="bar"
                />
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimaryCta,
                  styles.btnPrimaryCtaFull,
                  {
                    backgroundColor: color.primary,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.9 : 1,
                    shadowColor: color.primary,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/room/[id]",
                    params: { id: post.room.id, from: "home" },
                  })
                }
              >
                <Ionicons name="home-outline" size={20} color={color.primaryText} />
                <ThemedText
                  style={[styles.btnPrimaryCtaText, { color: color.primaryText }]}
                >
                  {t("postCard.viewRoom")}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Footer stats */}
      <View style={[styles.footer, { borderTopColor: color.border }]}>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={16} color={color.textSecondary} />
          <ThemedText style={[styles.statText, { color: color.textSecondary }]}>
            {t("postCard.views", { count: post.viewCount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US") })}
          </ThemedText>
        </View>
        {post.expirationDate && (
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color={color.textSecondary} />
            <ThemedText style={[styles.statText, { color: color.textSecondary }]}>
              {t("postCard.expires")}{" "}
              {new Date(post.expirationDate).toLocaleDateString(
                locale === "vi" ? "vi-VN" : "en-US",
              )}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  } as any,
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  postToolbar: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  postToolbarLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  postToolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
    maxWidth: "100%",
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  metaText: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: 8,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    minWidth: 0,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    fontSize: 13,
  },
  roomAttachment: {
    marginTop: 8,
    overflow: "hidden",
  },
  roomImage: {
    height: 250,
  },
  roomInfo: {
    padding: 16,
    gap: 6,
  },
  roomTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  roomMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  roomPrice: {
    fontWeight: "700",
    fontSize: 15,
  },
  roomAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  roomCtaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  btnPrimaryCta: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryCtaFull: {
    alignSelf: "stretch",
  },
  btnPrimaryCtaText: {
    fontSize: 15,
    fontWeight: "800",
  },
  ownerActionPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHint: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 4,
  },
  detailHintText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
