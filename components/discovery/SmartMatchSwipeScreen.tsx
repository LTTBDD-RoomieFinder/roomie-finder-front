import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Check, Heart, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MatchPercentRing } from "@/components/discovery/MatchPercentRing";
import type { SmartMatchProfile } from "@/components/discovery/types";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useSmartMatchSuggestions } from "@/hooks/use-smart-match-suggestions";

const { width: W } = Dimensions.get("window");
const SWIPE_OUT = W * 0.55;
const H_PADDING = 20;
const CARD_IMAGE_MAX = Math.min(W * 0.68, 380);
const PLACEHOLDER = require("@/assets/images/placeholder.png") as number;

type TagType = "match" | "conflict" | "neutral";

function TagChip({ label, type }: { label: string; type: TagType }) {
  const palette =
    type === "match"
      ? { bg: "rgba(16, 185, 129, 0.2)", border: "rgba(16, 185, 129, 0.45)", fg: "#A7F3D0" }
      : type === "conflict"
        ? { bg: "rgba(244, 63, 94, 0.2)", border: "rgba(244, 63, 94, 0.45)", fg: "#FECDD3" }
        : { bg: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.25)", fg: "rgba(255,255,255,0.92)" };
  return (
    <View
      style={[styles.tagOuter, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      <Text style={[styles.tagLabel, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ProfileCard({ profile }: { profile: SmartMatchProfile }) {
  const { t } = useLanguage();
  const { color, radius } = useAppTheme();
  const imgSource =
    profile.imageUrl && profile.imageUrl.trim().length > 0
      ? { uri: profile.imageUrl.trim() }
      : PLACEHOLDER;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color.card,
          borderColor: color.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={[styles.cardImageWrap, { height: CARD_IMAGE_MAX }]}>
        <Image
          source={typeof imgSource === "number" ? imgSource : imgSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(15,23,42,0.45)", "rgba(15,23,42,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.ringBadge}>
          <View style={styles.ringInner}>
            <MatchPercentRing percent={profile.matchPercent} size={60} />
          </View>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text
              style={styles.nameText}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {profile.name}
            </Text>
            {typeof profile.age === "number" && !Number.isNaN(profile.age) ? (
              <Text style={styles.ageText}>{profile.age}</Text>
            ) : null}
          </View>
          {profile.verified ? (
            <View style={styles.verifyRow}>
              <View style={styles.verifyBadge}>
                <Check size={13} color="#A7F3D0" strokeWidth={2.5} />
                <Text style={styles.verifyText}>{t("verification.badge")}</Text>
              </View>
            </View>
          ) : null}
          <Text style={styles.subtitle} numberOfLines={2}>
            {profile.subtitle}
          </Text>
          {profile.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {profile.tags.map((x) => (
                <TagChip key={x.id} label={x.label} type={x.type} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function SmartMatchSwipeScreen() {
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { profiles, loading, error, refetch, isAuthenticated } = useSmartMatchSuggestions(t);

  const [i, setI] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = profiles.length;
  const profile = count > 0 ? profiles[Math.min(i, count - 1)] : null;

  const tx = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    if (i >= count && count > 0) setI(0);
  }, [i, count]);

  useEffect(() => {
    tx.value = 0;
    rot.value = 0;
  }, [i, profile?.id, rot, tx]);

  const advance = useCallback(() => {
    setI((k) => {
      if (count <= 0) return 0;
      return (k + 1) % count;
    });
  }, [count]);

  const hapticMed = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  const hapticHeavy = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const scheduleAdvance = useCallback(
    (targetX: number) => {
      if (count <= 0) return;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      tx.value = withSpring(targetX, { damping: 16, stiffness: 130, mass: 0.45 });
      advanceTimer.current = setTimeout(() => {
        advance();
      }, 260);
    },
    [advance, count, tx],
  );

  const pan = Gesture.Pan()
    .enabled(count > 0 && profile != null)
    .activeOffsetX([-16, 16])
    .onUpdate((e) => {
      tx.value = e.translationX;
      rot.value = interpolate(e.translationX, [-W, 0, W], [8, 0, -8]);
    })
    .onEnd((e) => {
      if (e.translationX > 100) {
        runOnJS(hapticMed)();
        runOnJS(scheduleAdvance)(SWIPE_OUT);
      } else if (e.translationX < -100) {
        runOnJS(hapticHeavy)();
        runOnJS(scheduleAdvance)(-SWIPE_OUT);
      } else {
        tx.value = withSpring(0, { damping: 20, stiffness: 240 });
        rot.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { rotate: `${rot.value}deg` }],
  }));

  const likeStamp = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, -W * 0.18], [0, 0.92]),
  }));

  const nopeStamp = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, W * 0.18], [0, 0.92]),
  }));

  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.root, { backgroundColor: color.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: color.primary,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: 16,
            paddingHorizontal: H_PADDING,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View
            style={[styles.headerIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <IconSymbol name="heart.fill" size={28} color={color.primaryText} />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText
              style={[styles.headerTitle, { color: color.primaryText }]}
              lightColor={color.primaryText}
              darkColor={color.primaryText}
            >
              {t("smartMatch.title")}
            </ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: color.primaryText, opacity: 0.9 }]}
              lightColor={color.primaryText}
              darkColor={color.primaryText}
            >
              {t("smartMatch.subtitle")}
            </ThemedText>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={color.primary} />
          <ThemedText style={[styles.muted, { color: color.textSecondary }]}>
            {t("matching.computing")}
          </ThemedText>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.centerBlock}>
          <ThemedText type="defaultSemiBold" style={styles.callout}>
            {t("smartMatch.loginRequired")}
          </ThemedText>
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: color.primary,
                borderRadius: 9999,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryBtnLabel, { color: color.primaryText }]}>
              {t("smartMatch.signIn")}
            </Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.centerBlock}>
          <ThemedText style={{ color: color.error, textAlign: "center" }}>{error}</ThemedText>
          <Pressable
            onPress={() => void refetch()}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: color.primary,
                borderRadius: 9999,
                opacity: pressed ? 0.9 : 1,
                marginTop: 6,
              },
            ]}
          >
            <Text style={[styles.primaryBtnLabel, { color: color.primaryText }]}>
              {t("common.retry")}
            </Text>
          </Pressable>
        </View>
      ) : !profile ? (
        <View style={styles.centerBlock}>
          <ThemedText style={{ color: color.textSecondary, textAlign: "center" }}>
            {t("smartMatch.empty")}
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.swipeArea}>
            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.cardMax, cardStyle]}>
                <View style={styles.stampWrap}>
                  <ProfileCard profile={profile} />
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.stampLike, likeStamp]}
                  >
                    <Text style={styles.stampLikeText}>Connect</Text>
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.stampNope, nopeStamp]}
                  >
                    <Text style={styles.stampNopeText}>Pass</Text>
                  </Animated.View>
                </View>
              </Animated.View>
            </GestureDetector>
          </View>

          <View style={[styles.actionsRow, { paddingBottom: bottomPad }]}>
            <Pressable
              onPress={() => {
                if (count <= 0) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                scheduleAdvance(SWIPE_OUT);
              }}
              style={({ pressed }) => [
                styles.actionCircle,
                styles.actionNope,
                {
                  borderColor: color.border,
                  backgroundColor: color.card,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <X size={28} color={color.error} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (count <= 0) return;
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                scheduleAdvance(-SWIPE_OUT);
              }}
              style={({ pressed }) => [
                styles.actionCircle,
                styles.actionLike,
                {
                  backgroundColor: color.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Heart size={28} color={color.primaryText} fill={color.primaryText} strokeWidth={2} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  muted: {
    fontSize: 14,
    textAlign: "center",
  },
  callout: { textAlign: "center" },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  primaryBtnLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  swipeArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cardMax: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  stampWrap: {
    position: "relative",
  },
  stampLike: {
    position: "absolute",
    right: 12,
    top: "28%",
    borderWidth: 3,
    borderColor: "rgba(16, 185, 129, 0.95)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: "12deg" }],
  },
  stampLikeText: {
    color: "rgba(16, 185, 129, 1)",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stampNope: {
    position: "absolute",
    left: 12,
    top: "28%",
    borderWidth: 3,
    borderColor: "rgba(244, 63, 94, 0.95)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: "-12deg" }],
  },
  stampNopeText: {
    color: "rgba(244, 63, 94, 1)",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  cardImageWrap: {
    width: "100%",
  },
  ringBadge: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  ringInner: {
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 4,
  },
  cardInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  nameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },
  nameText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    flexShrink: 1,
  },
  ageText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 17,
    fontWeight: "600",
  },
  verifyRow: { marginTop: 4, marginBottom: 4 },
  verifyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.45)",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  verifyText: {
    color: "#D1FAE5",
    fontSize: 11,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  tagsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagOuter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "100%",
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingTop: 4,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  actionNope: {
    borderWidth: 1,
  },
  actionLike: {},
});
