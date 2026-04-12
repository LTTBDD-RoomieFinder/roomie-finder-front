import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";

import { PostRequestChatIcon } from "@/components/post/post-request-chat-icon";
import { ThemedText } from "@/components/themed-text";
import { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { usePostsJoinEligibility } from "@/hooks/use-posts-join-eligibility";
import { formatDate } from "@/utils/format-post";
import { formatRoomPrice } from "@/utils/format-room";

type Props = {
  post: PostResponse;
  currentUserId?: number | string;
  onEdit?: (post: PostResponse) => void;
  onDelete?: (post: PostResponse) => void;
};

export function PostCard({ post, currentUserId, onEdit, onDelete }: Props) {
  const { color } = useAppTheme();
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

  return (
    <View style={[styles.card]}>
      <View style={styles.header}>
        <Image
          source={
            post.user.avatarUrl
              ? { uri: post.user.avatarUrl }
              : require("@/assets/images/default-avatar.png")
          }
          style={[styles.avatar, { backgroundColor: color.backgroundSecondary }]}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold" style={styles.userName}>
            {post.user.fullName || post.user.username}
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText style={[styles.metaText, { color: color.textSecondary }]}>
              {formatDate(post.createdAt)}
            </ThemedText>
            <ThemedText style={{ color: color.textSecondary, fontSize: 12, marginHorizontal: 4 }}>·</ThemedText>
            <Ionicons
              name={post.status === "PUBLISHED" ? "earth" : post.status === "DRAFT" ? "document-text" : "eye-off"}
              size={12}
              color={color.textSecondary}
            />
          </View>
        </View>

        {/* Owner actions menu */}
        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: pressed ? color.backgroundSecondary : "transparent" },
              ]}
              onPress={() => onEdit?.(post)}
            >
              <Ionicons name="pencil-outline" size={18} color={color.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: pressed ? color.backgroundSecondary : "transparent" },
              ]}
              onPress={() => onDelete?.(post)}
            >
              <Ionicons name="trash-outline" size={18} color={color.error} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Content */}
      <View>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {post.title}
        </ThemedText>
        <ThemedText style={[styles.content, { color: color.text }]} numberOfLines={5}>
          {post.content}
        </ThemedText>
      </View>

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
              <View style={styles.roomActionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.viewMoreBtn,
                    {
                      backgroundColor: pressed
                        ? color.border
                        : color.background,
                      borderColor: color.border,
                      flex: 1,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/room/[id]",
                      params: { id: post.room.id, from: "home" },
                    })
                  }
                >
                  <ThemedText
                    style={[styles.viewMoreText, { color: color.tint }]}
                  >
                    {t("postCard.viewRoom")}
                  </ThemedText>
                </Pressable>

                {/* Nút request chat nhỏ (xếp hàng khi full). */}
                <PostRequestChatIcon
                  post={post}
                  currentUserId={currentUserId}
                  eligibility={elig}
                  eligibilityLoading={eligLoading}
                  eligibilityError={eligError}
                  onRetryEligibility={refreshElig}
                />
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.viewMoreBtn,
                  {
                    backgroundColor: pressed
                      ? color.border
                      : color.background,
                    borderColor: color.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/room/[id]",
                    params: { id: post.room.id, from: "home" },
                  })
                }
              >
                <ThemedText
                  style={[styles.viewMoreText, { color: color.tint }]}
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
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
  ownerActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
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
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 6,
    lineHeight: 22,
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
    marginBottom: 4,
  },
  viewMoreBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  roomActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  viewMoreText: {
    fontWeight: "600",
    fontSize: 14,
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
