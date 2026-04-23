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
  Alert,
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { genderReqLabelKey, roomTypeLabelKey } from "@/lib/i18n-labels";
import { formatRoomPrice } from "@/utils/format-room";
import { openGoogleMapsDirections } from "@/utils/open-google-directions";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(SCREEN_H * 0.68);
const IMAGE_HEIGHT = 220;

type Props = {
  visible: boolean;
  post: PostResponse | null;
  loading: boolean;
  /** Tọa độ ghim map (ưu tiên hơn address trong bài). */
  directionsTarget?: { lat: number; lng: number } | null;
  onClose: () => void;
  onViewDetails: (roomId: number) => void;
};

function RoomPreviewSheetInner({
  visible,
  post,
  loading,
  directionsTarget = null,
  onClose,
  onViewDetails,
}: Props) {
  const { color, scheme, radius } = useAppTheme();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  // Slide animation
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Image carousel state
  const [imgPage, setImgPage] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    if (!visible || !post) return;
    setImgPage(0);
    carouselRef.current?.scrollTo({ x: 0, animated: false });
  }, [post?.id, visible]);

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
  const images: string[] =
    room?.imageUrls?.filter((u) => typeof u === "string" && u.length > 0) ?? [];

  const priceStr = room ? formatRoomPrice(room.price, t, locale) : "";
  const roomTypeLabel = room ? t(roomTypeLabelKey(room.roomType)) : "";
  const genderLabel = room ? t(genderReqLabelKey(room.genderRequirement)) : "";

  const displayTitle =
    (room?.title?.trim() || post?.title?.trim() || "") ||
    t("postSearch.noTitle");
  const displayDescription = (
    room?.description?.trim() ||
    post?.content?.trim() ||
    ""
  ).trim();

  const addressLine = [
    room?.address?.streetAddress,
    room?.address?.ward,
    room?.address?.district,
    room?.address?.city,
  ]
    .filter(Boolean)
    .join(", ");

  const ownerName = post?.user?.fullName || post?.user?.username || t("common.user");
  const ownerLetter = ownerName.trim().charAt(0).toUpperCase();

  const destForDirections =
    directionsTarget ??
    (post?.room?.address?.lat != null &&
    post?.room?.address?.lng != null &&
    Number.isFinite(post.room.address.lat) &&
    Number.isFinite(post.room.address.lng)
      ? { lat: post.room.address.lat, lng: post.room.address.lng }
      : null);

  const handleOpenDirections = useCallback(async () => {
    if (!destForDirections) {
      Alert.alert(t("common.error"), t("map.directionsNoCoords"));
      return;
    }
    try {
      await openGoogleMapsDirections(destForDirections.lat, destForDirections.lng);
    } catch {
      Alert.alert(t("common.error"), t("map.directionsOpenFailed"));
    }
  }, [destForDirections, t]);

  const handleOpenOwnerProfile = useCallback(() => {
    const uid = post?.user?.id?.toString().trim();
    if (!uid) return;
    onClose();
    router.push({ pathname: "/user/[id]", params: { id: uid } });
  }, [post?.user?.id, onClose, router]);

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
                    ref={carouselRef}
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

            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbStripInner}
                style={[
                  styles.thumbStrip,
                  { borderBottomColor: color.border, backgroundColor: color.background },
                ]}
              >
                {images.map((uri, i) => (
                  <Pressable
                    key={`${i}-${uri}`}
                    onPress={() => {
                      setImgPage(i);
                      carouselRef.current?.scrollTo({
                        x: i * SCREEN_W,
                        animated: true,
                      });
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={[
                        styles.thumbTile,
                        {
                          borderColor:
                            i === imgPage ? color.primary : color.border,
                          borderWidth: i === imgPage ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                      contentFit="cover"
                      transition={150}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}

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
                {displayTitle}
              </ThemedText>

              {/* ── Specs row ────── */}
              <View style={[styles.specsRow, { backgroundColor: color.backgroundSecondary, borderRadius: radius.lg }]}>
                <View style={styles.specItem}>
                  <Ionicons name="resize-outline" size={16} color={color.primary} />
                  <ThemedText style={[styles.specText, { color: color.text }]}>
                    {room?.area && room.area > 0
                      ? `${room.area} m²`
                      : "—"}
                  </ThemedText>
                </View>
                <View style={[styles.specDivider, { backgroundColor: color.border }]} />
                <View style={styles.specItem}>
                  <Ionicons name="people-outline" size={16} color={color.primary} />
                  <ThemedText style={[styles.specText, { color: color.text }]}>
                    {room?.capacity && room.capacity > 0
                      ? t("room.detail.capacityValue", { count: room.capacity })
                      : "—"}
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
                  {addressLine || t("postSearch.addressPending")}
                </ThemedText>
              </View>

              {/* ── Owner (tap → public profile & reviews) ────── */}
              <Pressable
                onPress={handleOpenOwnerProfile}
                disabled={!post.user?.id}
                accessibilityRole="button"
                accessibilityLabel={t("publicUser.openProfileA11y")}
                style={({ pressed }) => [
                  styles.ownerRow,
                  { borderColor: color.border },
                  pressed && post.user?.id ? { opacity: 0.88 } : null,
                ]}
              >
                <UserAvatar
                  userId={post.user?.id}
                  hintUrl={post.user?.avatarUrl}
                  name={ownerName}
                  size={44}
                  style={styles.ownerAvatar}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.ownerName, { color: color.text }]} numberOfLines={1}>
                    {ownerName}
                  </ThemedText>
                  {!!post.user?.username?.trim() && (
                    <ThemedText style={[styles.ownerSub, { color: color.textSecondary }]}>
                      @{post.user.username}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.viewCount}>
                  <Ionicons name="eye-outline" size={13} color={color.textSecondary} />
                  <ThemedText style={[styles.viewCountText, { color: color.textSecondary }]}>
                    {post.viewCount ?? 0}
                  </ThemedText>
                </View>
                {post.user?.id ? (
                  <Ionicons name="chevron-forward" size={18} color={color.icon} style={{ marginLeft: 4 }} />
                ) : null}
              </Pressable>

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
              {!!displayDescription && (
                <View style={styles.descSection}>
                  <ThemedText style={[styles.sectionLabel, { color: color.textSecondary }]}>
                    {t("room.detail.description")}
                  </ThemedText>
                  <ThemedText
                    style={[styles.description, { color: color.text }]}
                    numberOfLines={3}
                  >
                    {displayDescription}
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
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[
                  styles.ctaBtnOutline,
                  {
                    borderColor: color.primary,
                    backgroundColor: color.backgroundSecondary,
                    opacity: destForDirections ? 1 : 0.45,
                  },
                ]}
                onPress={handleOpenDirections}
                activeOpacity={0.82}
                disabled={!destForDirections}
              >
                <Ionicons name="navigate" size={18} color={color.primary} />
                <ThemedText style={[styles.ctaBtnOutlineText, { color: color.primary }]}>
                  {t("map.openDirections")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: color.primary, flex: 1 }]}
                onPress={() => onViewDetails(post.room.id)}
                activeOpacity={0.82}
              >
                <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
                <ThemedText style={[styles.ctaBtnText, { color: "#fff" }]}>
                  {t("map.viewRoomDetail")}
                </ThemedText>
              </TouchableOpacity>
            </View>
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
  thumbStrip: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 84,
  },
  thumbStripInner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  thumbTile: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
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
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctaBtnOutline: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 27,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ctaBtnOutlineText: {
    fontWeight: "700",
    fontSize: 14,
    maxWidth: 110,
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
