import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { PostJoinEligibility } from "@/types/post-join-eligibility";

const HIT = 36;

type Props = {
  post: PostResponse;
  currentUserId?: number | string;
  eligibility: PostJoinEligibility | undefined;
  eligibilityLoading: boolean;
  eligibilityError: boolean;
  onRetryEligibility?: () => void;
};

/** Icon nhỏ: mời vào nhóm chat (chi tiết bài đăng). */
export function PostRequestChatIcon({
  post,
  currentUserId,
  eligibility,
  eligibilityLoading,
  eligibilityError,
  onRetryEligibility,
}: Props) {
  const { color } = useAppTheme();
  const isOwner =
    currentUserId !== undefined &&
    String(post.user.id) === String(currentUserId);

  const goCreate = useCallback(() => {
    router.push({
      pathname: "/request/create",
      params: {
        receiverId: String(post.user.id),
        postId: String(post.id),
        receiver: JSON.stringify(post.user),
      },
    });
  }, [post.id, post.user]);

  const onFullPress = useCallback(() => {
    const occ = eligibility?.currentOccupancy ?? 0;
    const cap = eligibility?.roomCapacity ?? 0;
    Alert.alert(
      "Đã đủ người",
      `Nhóm chat của bài đăng này đã đủ (${occ}/${cap}).`,
    );
  }, [eligibility]);

  const onAlreadyRequestedPress = useCallback(() => {
    Alert.alert("Đã gửi lời mời", "Bạn đã gửi lời mời cho bài đăng này rồi.");
  }, []);

  if (isOwner) {
    return <View style={styles.placeholder} />;
  }

  if (currentUserId === undefined) {
    return (
      <Pressable
        onPress={() => router.push("/(auth)/login")}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? color.tint + "18" : "transparent" },
        ]}
        hitSlop={8}
        accessibilityLabel="Đăng nhập để gửi lời mời vào nhóm chat"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={22} color={color.tint} />
      </Pressable>
    );
  }

  if (eligibilityError) {
    return (
      <Pressable
        onPress={onRetryEligibility}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? color.error + "18" : "transparent" },
        ]}
        hitSlop={8}
        accessibilityLabel="Thử lại"
      >
        <Ionicons name="refresh-outline" size={22} color={color.error} />
      </Pressable>
    );
  }

  if (eligibilityLoading || eligibility === undefined) {
    return (
      <View style={styles.btn} accessibilityLabel="Đang kiểm tra">
        <ActivityIndicator size="small" color={color.tint} />
      </View>
    );
  }

  // Part 1: Khi full thì vẫn cho phép tạo request (xếp hàng),
  // nên chỉ “chặn” khi ALREADY_REQUESTED/OWN_POST/POST_NOT_FOUND.
  const canQueue =
    eligibility.disabledReason === "CHAT_ROOM_FULL" && !eligibility.canRequestJoinChatRoom;

  if (eligibility.canRequestJoinChatRoom || canQueue) {
    return (
      <Pressable
        onPress={goCreate}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? color.tint + "28" : color.tint + "14" },
        ]}
        hitSlop={8}
        accessibilityLabel={canQueue ? "Xếp hàng vào nhóm chat" : "Gửi lời mời vào nhóm chat"}
      >
        <Ionicons name="chatbubbles-outline" size={21} color={color.tint} />
      </Pressable>
    );
  }

  if (eligibility.disabledReason === "ALREADY_REQUESTED") {
    return (
      <Pressable
        onPress={onAlreadyRequestedPress}
        style={styles.btn}
        hitSlop={8}
        accessibilityLabel="Bạn đã gửi lời mời rồi"
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={20}
          color={color.textSecondary}
          style={{ opacity: 0.6 }}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onFullPress}
      style={styles.btn}
      hitSlop={8}
      accessibilityLabel="Nhóm chat đã đủ người"
    >
      <Ionicons
        name="chatbubbles-outline"
        size={20}
        color={color.textSecondary}
        style={{ opacity: 0.45 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: HIT,
    height: HIT,
  },
});
