import React from "react";
import { Pressable, StyleSheet, View, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons"; 

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { RoomResponse } from "@/data/response";
import { formatDate } from "@/utils/format-post";

export type PostSearchAuthor = {
  id?: number;
  fullName: string;
  phoneNumber?: string;
};

export type PostSearchResult = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  room?: RoomResponse; 
  author?: PostSearchAuthor;
};

type Props = {
  post: PostSearchResult;
  onPress: () => void;
};

export function PostSearchResultCard({ post, onPress }: Props) {
  const { color } = useAppTheme();

  if (!post) return null;

  const { title, content, createdAt, room, author } = post;
  
  const authorName = author?.fullName || "Người dùng ẩn danh";
  const avatarLetter = authorName.trim().charAt(0).toUpperCase();
  const thumb = room?.imageUrls?.[0];
  const priceDisplay = room?.price ? `${room.price.toLocaleString("vi-VN")}đ` : "Thỏa thuận";

  console.log("Dữ liệu Tác giả từ API:", post.author);

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
        <View style={[styles.avatar, { backgroundColor: color.primary + "1A" }]}> 
          <ThemedText style={{ fontWeight: "800", color: color.primary, fontSize: 16 }}>
            {avatarLetter}
          </ThemedText>
        </View>
        
        <View style={styles.authorInfo}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ fontSize: 15 }}>
            {authorName}
          </ThemedText>
          <ThemedText style={{ color: color.textSecondary, fontSize: 12, marginTop: 2 }}>
            {createdAt ? formatDate(createdAt) : "Vừa xong"}
          </ThemedText>
        </View>

        <View style={[styles.badge, { backgroundColor: color.backgroundSecondary }]}>
          <Feather name="home" size={12} color={color.primary} />
          <ThemedText style={{ fontSize: 11, color: color.primary, fontWeight: "600" }}>
            Cho thuê
          </ThemedText>
        </View>
      </View>

      <View style={styles.bodySection}>
        <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
          {title || "Không có tiêu đề"}
        </ThemedText>
        <ThemedText style={{ color: color.textSecondary, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
          {content || "Không có nội dung mô tả."}
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
              {room.title || "Phòng trọ"}
            </ThemedText>
            
            <View style={styles.metaRow}>
              <ThemedText style={{ color: color.primary, fontWeight: "800", fontSize: 14 }}>
                {priceDisplay}
                {room.price ? <ThemedText style={{ fontSize: 12, color: color.textSecondary, fontWeight: '400' }}>/tháng</ThemedText> : null}
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
                {[room.address?.district, room.address?.city].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}
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