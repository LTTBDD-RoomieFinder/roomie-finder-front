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

import { ThemedText } from "@/components/themed-text";
import type { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import type { PostJoinEligibility } from "@/types/post-join-eligibility";

const HIT = 40;

type Props = {
  post: PostResponse;
  currentUserId?: number | string;
  eligibility: PostJoinEligibility | undefined;
  eligibilityLoading: boolean;
  eligibilityError: boolean;
  onRetryEligibility?: () => void;
  /**
   * `bar`: cùng hàng với nút "Xem phòng" — cao, có viền + chữ.
   * `icon`: hành cũ (chỉ icon tròn).
   */
  variant?: "icon" | "bar";
};

export function PostRequestChatIcon({
  post,
  currentUserId,
  eligibility,
  eligibilityLoading,
  eligibilityError,
  onRetryEligibility,
  variant = "icon",
}: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const isBar = variant === "bar";
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
      t("request.postIcon.fullTitle"),
      t("request.postIcon.fullMessage", { occ, cap }),
    );
  }, [eligibility, t]);

  const onAlreadyRequestedPress = useCallback(() => {
    Alert.alert(
      t("request.postIcon.alreadyTitle"),
      t("request.postIcon.alreadyMessage"),
    );
  }, [t]);

  if (isOwner) {
    return isBar ? <View style={styles.barSpacer} /> : <View style={styles.placeholder} />;
  }

  const labelStyle = (c: string) => [
    styles.barLabel,
    { color: c },
  ];

  if (currentUserId === undefined) {
    return (
      <Pressable
        onPress={() => router.push("/(auth)/login")}
        style={({ pressed }) => [
          isBar ? styles.bar : styles.btn,
          isBar
            ? {
                borderColor: color.primary,
                backgroundColor: pressed
                  ? color.primary + "22"
                  : color.primary + "12",
              }
            : { backgroundColor: pressed ? color.tint + "18" : "transparent" },
        ]}
        hitSlop={isBar ? 0 : 8}
        accessibilityLabel={t("request.postIcon.loginA11y")}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={isBar ? 20 : 22}
          color={color.primary}
        />
        {isBar ? (
          <ThemedText style={labelStyle(color.primary)} numberOfLines={1}>
            {t("postCard.chatLoginCta")}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  }

  if (eligibilityError) {
    return (
      <Pressable
        onPress={onRetryEligibility}
        style={({ pressed }) => [
          isBar ? styles.bar : styles.btn,
          isBar
            ? {
                borderColor: color.error,
                backgroundColor: pressed ? color.error + "18" : color.error + "0D",
              }
            : { backgroundColor: pressed ? color.error + "18" : "transparent" },
        ]}
        hitSlop={isBar ? 0 : 8}
        accessibilityLabel={t("request.postIcon.retryA11y")}
      >
        <Ionicons
          name="refresh-outline"
          size={isBar ? 20 : 22}
          color={color.error}
        />
        {isBar ? (
          <ThemedText style={labelStyle(color.error)} numberOfLines={1}>
            {t("postCard.chatRetryCta")}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  }

  if (eligibilityLoading || eligibility === undefined) {
    return (
      <View
        style={[
          isBar ? styles.bar : styles.btn,
          isBar
            ? { borderColor: color.border, backgroundColor: color.card }
            : null,
        ]}
        accessibilityLabel={t("request.postIcon.checkingA11y")}
      >
        <ActivityIndicator size="small" color={color.primary} />
        {isBar ? (
          <ThemedText
            style={[styles.barLabel, { color: color.textSecondary }]}
            numberOfLines={1}
          >
            {t("postCard.chatChecking")}
          </ThemedText>
        ) : null}
      </View>
    );
  }

  const canQueue =
    eligibility.disabledReason === "CHAT_ROOM_FULL" &&
    !eligibility.canRequestJoinChatRoom;

  if (eligibility.canRequestJoinChatRoom || canQueue) {
    return (
      <Pressable
        onPress={goCreate}
        style={({ pressed }) => [
          isBar ? styles.bar : styles.btn,
          isBar
            ? {
                borderColor: color.primary,
                backgroundColor: pressed
                  ? color.primary + "24"
                  : color.primary + "14",
              }
            : { backgroundColor: pressed ? color.tint + "28" : color.tint + "14" },
        ]}
        hitSlop={isBar ? 0 : 8}
        accessibilityLabel={
          canQueue ? t("request.postIcon.queueA11y") : t("request.postIcon.sendA11y")
        }
      >
        <Ionicons
          name="chatbubbles-outline"
          size={isBar ? 20 : 21}
          color={color.primary}
        />
        {isBar ? (
          <ThemedText style={labelStyle(color.primary)} numberOfLines={1}>
            {canQueue
              ? t("postCard.requestQueueCta")
              : t("postCard.requestCta")}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  }

  if (eligibility.disabledReason === "ALREADY_REQUESTED") {
    return (
      <Pressable
        onPress={onAlreadyRequestedPress}
        style={[
          isBar ? styles.bar : styles.btn,
          isBar
            ? {
                borderColor: color.border,
                backgroundColor: color.backgroundSecondary,
              }
            : null,
        ]}
        hitSlop={isBar ? 0 : 8}
        accessibilityLabel={t("request.postIcon.sentA11y")}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={isBar ? 20 : 20}
          color={color.textSecondary}
          style={isBar ? undefined : { opacity: 0.6 }}
        />
        {isBar ? (
          <ThemedText
            style={[styles.barLabel, { color: color.textSecondary }]}
            numberOfLines={1}
          >
            {t("postCard.requestSentCta")}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onFullPress}
      style={[
        isBar ? styles.bar : styles.btn,
        isBar
          ? { borderColor: color.border, backgroundColor: color.backgroundSecondary }
          : null,
      ]}
      hitSlop={isBar ? 0 : 8}
      accessibilityLabel={t("request.postIcon.fullA11y")}
    >
      <Ionicons
        name="chatbubbles-outline"
        size={isBar ? 20 : 20}
        color={color.textSecondary}
        style={isBar ? { opacity: 0.7 } : { opacity: 0.45 }}
      />
      {isBar ? (
        <ThemedText
          style={[styles.barLabel, { color: color.textSecondary }]}
          numberOfLines={1}
        >
          {t("postCard.chatFullCta")}
        </ThemedText>
      ) : null}
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
  bar: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  barSpacer: {
    flex: 1,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  placeholder: {
    width: HIT,
    height: HIT,
  },
});
