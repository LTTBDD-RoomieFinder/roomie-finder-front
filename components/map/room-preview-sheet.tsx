import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { VerificationStatusChip } from "@/components/reputation/verification-status-chip";
import type { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { genderReqLabelKey, roomTypeLabelKey } from "@/lib/i18n-labels";
import { useProfileAvatarStore } from "@/stores/useProfileAvatarStore";
import { VerificationStatus } from "@/types/enums";
import { formatRoomPrice } from "@/utils/format-room";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(SCREEN_H * 0.68);
const IMAGE_HEIGHT = 220;

type Props = {
  visible: boolean;
  post: PostResponse | null;
  loading: boolean;
  onClose: () => void;
  onViewDetails: (roomId: number) => void;
};

function RoomPreviewSheetInner({
  visible,
  post,
  loading,
  onClose,
  onViewDetails,
}: Props) {
  const { color, scheme, radius } = useAppTheme();
  const { t, locale } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  // Slide animation
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Image carousel state
  const [imgPage, setImgPage] = useState(0);

  // Avatar from shared cache
  const { cache, fetchAvatar } = useProfileAvatarStore();
  const ownerId = post?.user?.id ? String(post.user.id) : null;
  if (ownerId && !(ownerId in cache)) fetchAvatar(ownerId);
  const ownerAvatar = (ownerId ? cache[ownerId] : null) ?? post?.user?.avatarUrl ?? null;

  // Animate in/out
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      damping: 22,
      stiffness: 240,
      mass: 0.9,
    }).start();
    if (!visible) setImgPage(0);
  }, [visible, translateY]);

  // Swipe-down to close
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 8 && Math.abs(g.dx) < 20 && g.dy > 0,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 80 || g.vy > 1.0) {
            onClose();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 260,
            }).start();
          }
        },
      }),
    [onClose, translateY],
  );

  const handleImgScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      setImgPage(page);
    },
    [],
  );

  const room = post?.room;
  const images: string[] = room?.imageUrls?.length
    ? room.imageUrls
    : [];

  const priceStr = room ? formatRoomPrice(room.price, t, locale) : "";
  const roomTypeLabel = room ? t(roomTypeLabelKey(room.roomType)) : "";
  const genderLabel = room ? t(genderReqLabelKey(room.genderRequirement)) : "";

  const ownerName = post?.user?.fullName || post?.user?.username || t("common.user");
  const ownerLetter = ownerName.trim().charAt(0).toUpperCase();

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: color.background,
            height: SHEET_HEIGHT + insets.bottom,
            transform: [{ translateY }],
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
        ]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={[styles.handle, { backgroundColor: color.border }]} />
        </View>

        {loading || !post ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={color.primary} />
            <ThemedText style={{ color: color.textSecondary, marginTop: 14 }}>
              {t("common.loading")}
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            bounces={Platform.OS === "ios"}
          >
            {/* ── Image Carousel ───────────────────────────────────────── */}
            <View style={[styles.carouselWrap, { height: IMAGE_HEIGHT }]}>
              {images.length > 0 ? (
                <>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleImgScroll}
                    style={{ width: SCREEN_W, height: IMAGE_HEIGHT }}
                  >
                    {images.map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={{ width: SCREEN_W, height: IMAGE_HEIGHT }}
                        contentFit="cover"
                        transition={200}
                      />
                    ))}
                  </ScrollView>
                  {/* Page dots */}
                  {images.length > 1 && (
                    <View style={styles.dots}>
                      {images.map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            {
                              backgroundColor: i === imgPage ? "#fff" : "rgba(255,255,255,0.45)",
                              width: i === imgPage ? 18 : 6,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                  {/* Image counter badge */}
                  <View style={styles.imgCountBadge}>
                    <ThemedText style={styles.imgCountText}>
                      {imgPage + 1} / {images.length}
                    </ThemedText>
                  </View>
                </>
              ) : (
                <Image
                  source={require("@/assets/images/placeholder.png")}
                  style={{ width: SCREEN_W, height: IMAGE_HEIGHT }}
                  contentFit="cover"
                />
              )}
            </View>

            {/* ── Content ──────────────────────────────────────────────── */}
            <View style={styles.content}>
              {/* Price + type row */}
              <View style={styles.priceRow}>
                <ThemedText style={[styles.price, { color: color.primary }]}>
                  {priceStr}
                </ThemedText>
                <View style={[styles.typeChip, { backgroundColor: color.primary + "18", borderColor: color.primary + "40" }]}>
                  <ThemedText style={[styles.typeChipText, { color: color.primary }]}>
                    {roomTypeLabel}
                  </ThemedText>
                </View>
              </View>

              {/* Title */}
              <ThemedText style={styles.roomTitle} numberOfLines={2}>
                {room?.title}
              </ThemedText>

              {/* ── Specs row ────── */}
              <View style={[styles.specsRow, { backgroundColor: color.backgroundSecondary, borderRadius: radius.card }]}>
                <View style={styles.specItem}>
                  <Ionicons name="resize-outline" size={16} color={color.primary} />
                  <ThemedText style={[styles.specText, { color: color.text }]}>
                    {room?.area} m²
                  </ThemedText>
                </View>
                <View style={[styles.specDivider, { backgroundColor: color.border }]} />
                <View style={styles.specItem}>
                  <Ionicons name="people-outline" size={16} color={color.primary} />
                  <ThemedText style={[styles.specText, { color: color.text }]}>
                    {t("room.detail.capacityValue", { count: room?.capacity ?? 0 })}
                  </ThemedText>
                </View>
                <View style={[styles.specDivider, { backgroundColor: color.border }]} />
                <View style={styles.specItem}>
                  <Ionicons name="person-outline" size={16} color={color.primary} />
                  <ThemedText style={[styles.specText, { color: color.text }]} numberOfLines={1}>
                    {genderLabel}
                  </ThemedText>
                </View>
              </View>

              {/* ── Location ────── */}
              <View style={styles.locationRow}>
                <Ionicons name="location" size={15} color={color.primary} />
                <ThemedText style={[styles.locationText, { color: color.textSecondary }]} numberOfLines={2}>
                  {[
                    room?.address?.streetAddress,
                    room?.address?.ward,
                    room?.address?.district,
                    room?.address?.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </ThemedText>
              </View>

              {/* ── Owner ────── */}
              <View style={[styles.ownerRow, { borderColor: color.border }]}>
                {ownerAvatar ? (
                  <Image
                    source={{ uri: ownerAvatar }}
                    style={styles.ownerAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.ownerAvatar, { backgroundColor: color.primary + "22", alignItems: "center", justifyContent: "center" }]}>
                    <ThemedText style={{ fontWeight: "700", color: color.primary, fontSize: 15 }}>
                      {ownerLetter}
                    </ThemedText>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.ownerName, { color: color.text }]} numberOfLines={1}>
                    {ownerName}
                  </ThemedText>
                  <ThemedText style={[styles.ownerSub, { color: color.textSecondary }]}>
                    @{post.user.username}
                  </ThemedText>
                </View>
                <View style={styles.viewCount}>
                  <Ionicons name="eye-outline" size={13} color={color.textSecondary} />
                  <ThemedText style={[styles.viewCountText, { color: color.textSecondary }]}>
                    {post.viewCount}
                  </ThemedText>
                </View>
              </View>

              {/* ── Amenities ────── */}
              {(room?.amenities?.length ?? 0) > 0 && (
                <View style={styles.amenitiesSection}>
                  <ThemedText style={[styles.sectionLabel, { color: color.textSecondary }]}>
                    {t("room.detail.amenities")}
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.amenitiesScroll}
                  >
                    {room!.amenities.slice(0, 8).map((a) => (
                      <View
                        key={a.id}
                        style={[styles.amenityChip, { backgroundColor: color.backgroundSecondary, borderColor: color.border }]}
                      >
                        <ThemedText style={[styles.amenityText, { color: color.text }]}>
                          {a.name}
                        </ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* ── Description ────── */}
              {!!room?.description && (
                <View style={styles.descSection}>
                  <ThemedText style={[styles.sectionLabel, { color: color.textSecondary }]}>
                    {t("room.detail.description")}
                  </ThemedText>
                  <ThemedText
                    style={[styles.description, { color: color.text }]}
                    numberOfLines={3}
                  >
                    {room.description}
                  </ThemedText>
                </View>
              )}

              {/* Post title / context */}
              {!!post.title && (
                <View style={[styles.postNote, { backgroundColor: isDark ? "#1a2620" : "#f0faf8", borderColor: color.primary + "30" }]}>
                  <Ionicons name="newspaper-outline" size={14} color={color.primary} />
                  <ThemedText style={[styles.postNoteText, { color: color.text }]} numberOfLines={2}>
                    {post.title}
                  </ThemedText>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* ── Fixed CTA bar ──────────────────────────────────────────── */}
        {!loading && post && (
          <View
            style={[
              styles.ctaBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: color.background,
                borderTopColor: color.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: color.primary }]}
              onPress={() => onViewDetails(post.room.id)}
              activeOpacity={0.82}
            >
              <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
              <ThemedText style={[styles.ctaBtnText, { color: "#fff" }]}>
                {t("map.viewRoomDetail")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </>
  );
}

export const RoomPreviewSheet = memo(RoomPreviewSheetInner);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  dragArea: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Carousel
  carouselWrap: {
    position: "relative",
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  imgCountBadge: {
    position: "absolute",
    top: 12,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imgCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Content
  content: {
    padding: 20,
    gap: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  roomTitle: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  // Specs
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  specItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  specDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    opacity: 0.5,
  },
  specText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Location
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Owner
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: "600",
  },
  ownerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  viewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCountText: {
    fontSize: 12,
  },
  // Amenities
  amenitiesSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amenitiesScroll: {
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Description
  descSection: {
    gap: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  // Post note
  postNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  postNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // CTA
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    height: 54,
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnText: {
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
