import React from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons"; 

import { ThemedText } from "@/components/themed-text";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { RoomResponse } from "@/data/response";
import { formatDate } from "@/utils/format-post";

export type PostSearchAuthor = {
  id?: number | string;
  fullName?: string | null;
  username?: string | null;
  phoneNumber?: string;
  avatarUrl?: string | null;
};

export type PostSearchResult = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  room?: RoomResponse;
  /** Normalised by postSearchService from `user` field. */
  author?: PostSearchAuthor;
  /** Raw field from backend — used as fallback if normalisation missed. */
  user?: PostSearchAuthor;
};

type Props = {
  post: PostSearchResult;
  onPress: () => void;
  /** Khi có, chạm hàng tác giả mở profile công khai (đánh giá). */
  onAuthorPress?: () => void;
};

export function PostSearchResultCard({ post, onPress, onAuthorPress }: Props) {
  const { color } = useAppTheme();
  const { t, locale } = useLanguage();

  if (!post) return null;

  const { title, content, createdAt, room } = post;

  // author is normalised by postSearchService; fall back to raw user field
  const author = post.author ?? post.user;
  const authorName =
    author?.fullName?.trim() ||
    author?.username?.trim() ||
    t("postSearch.anonymous");
  const thumb = room?.imageUrls?.[0];
  const loc = locale === "vi" ? "vi-VN" : "en-US";
  const priceDisplay = room?.price
    ? `${room.price.toLocaleString(loc)}đ`
    : t("postSearch.negotiable");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: color.background,
          borderColor: color.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...(pressed && { backgroundColor: color.backgroundSecondary }),
        },
      ]}
    >
      <View style={styles.topRow}>
        <UserAvatar
          userId={author?.id}
          hintUrl={author?.avatarUrl}
          name={authorName}
          size={48}
          style={styles.avatar}
        />
        
        <View style={styles.authorInfo}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ fontSize: 15 }}>
            {authorName}
          </ThemedText>
          <ThemedText style={{ color: color.textSecondary, fontSize: 12, marginTop: 2 }}>
            {createdAt ? formatDate(createdAt) : t("postSearch.justNow")}
          </ThemedText>
        </View>

        <View style={[styles.badge, { backgroundColor: color.backgroundSecondary }]}>
          <Feather name="home" size={12} color={color.primary} />
          <ThemedText style={{ fontSize: 11, color: color.primary, fontWeight: "600" }}>
            {t("postSearch.forRent")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.bodySection}>
        <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
          {title || t("postSearch.noTitle")}
        </ThemedText>
        <ThemedText style={{ color: color.textSecondary, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
          {content || t("postSearch.noDescription")}
        </ThemedText>
      </View>

      {room && (
        <View style={[styles.roomCard, { backgroundColor: color.card, borderColor: color.border }]}>
          <Image
            source={thumb ? { uri: thumb } : require("@/assets/images/placeholder.png")}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
          />
          
          <View style={styles.roomDetails}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ fontSize: 14 }}>
              {room.title || t("postSearch.defaultRoomTitle")}
            </ThemedText>
            
            <View style={styles.metaRow}>
              <ThemedText style={{ color: color.primary, fontWeight: "800", fontSize: 14 }}>
                {priceDisplay}
                {room.price ? (
                  <ThemedText
                    style={{ fontSize: 12, color: color.textSecondary, fontWeight: "400" }}
                  >
                    {t("postCard.perMonth")}
                  </ThemedText>
                ) : null}
              </ThemedText>
              
              {room.area && (
                <>
                  <View style={[styles.dot, { backgroundColor: color.textSecondary }]} />
                  <ThemedText style={{ color: color.textSecondary, fontSize: 13, fontWeight: "500" }}>
                    {room.area}m²
                  </ThemedText>
                </>
              )}
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={color.textSecondary} />
              <ThemedText style={{ color: color.textSecondary, fontSize: 12, flex: 1 }} numberOfLines={1}>
                {[room.address?.district, room.address?.city].filter(Boolean).join(", ") ||
                  t("postSearch.addressPending")}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorRowHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  cardMainPress: {
    borderRadius: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bodySection: {
    gap: 6,
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
  },
  roomCard: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
    alignItems: "center",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: "#E5E7EB",
  },
  roomDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
    height: 72,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});