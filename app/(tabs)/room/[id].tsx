import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { ProfileMatchSection } from "@/components/matching/profile-match-section";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoomResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { genderReqLabelKey, roomTypeLabelKey } from "@/lib/i18n-labels";
import { profileApi } from "@/apis/profile";
import { roomService } from "@/services/room-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileAvatarStore } from "@/stores/useProfileAvatarStore";
import { GenderRequirement, RoomType } from "@/types/enums";
import { formatRoomAddress, formatRoomPrice } from "@/utils/format-room";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";

const { width } = Dimensions.get("window");

export default function RoomDetailScreen() {
  const { id, from } = useLocalSearchParams();
  const router = useRouter();
  const { color } = useAppTheme();
  const { t, locale } = useLanguage();
  const user = useAuthStore((state) => state.user);

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hostName, setHostName] = useState("");
  const [hostAvatarHint, setHostAvatarHint] = useState<string | null>(null);
  const [hostLoading, setHostLoading] = useState(false);
  const applyHint = useProfileAvatarStore((s) => s.applyHint);

  const roomId = Number(Array.isArray(id) ? id[0] : id);
  const isValidRoomId = Number.isFinite(roomId) && roomId > 0;

  useFocusEffect(
    useCallback(() => {
      fetchRoom();
    }, [id])
  );

  const fetchRoom = async () => {
    if (!isValidRoomId) {
      return;
    }

    setLoading(true);
    try {
      const res = await roomService.getRoomById(roomId);
      setRoom(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ownerId = room?.ownerId;
    if (ownerId == null || !Number.isFinite(Number(ownerId))) {
      setHostName("");
      setHostAvatarHint(null);
      setHostLoading(false);
      return;
    }
    const idKey = String(ownerId);
    let cancelled = false;
    setHostLoading(true);
    setHostName("");
    setHostAvatarHint(null);
    profileApi
      .getUserProfile(idKey)
      .then((res: unknown) => {
        if (cancelled) return;
        const body = res as Record<string, unknown>;
        const data = (body?.data ?? body) as Record<string, unknown>;
        const name =
          (typeof data.fullName === "string" && data.fullName.trim()) ||
          (typeof data.full_name === "string" && data.full_name.trim()) ||
          (typeof data.username === "string" && data.username.trim()) ||
          (typeof data.user_name === "string" && data.user_name.trim()) ||
          "";
        setHostName(name);
        const av =
          typeof data.avatarUrl === "string"
            ? data.avatarUrl.trim() || null
            : typeof data.avatar_url === "string"
              ? data.avatar_url.trim() || null
              : null;
        setHostAvatarHint(av);
        applyHint(idKey, av);
      })
      .catch(() => {
        if (!cancelled) setHostName("");
      })
      .finally(() => {
        if (!cancelled) setHostLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room?.ownerId, applyHint]);

  const handleBack = () => {
    if (from === 'home') {
      router.push("/(tabs)/home");
    } else if (from === 'room') {
      router.push("/(tabs)/room");
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    Alert.alert(t("room.deleteTitle"), t("room.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (!isValidRoomId) return;
            await roomService.deleteRoom(roomId);
            handleBack();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  if (!isValidRoomId) {
    return (
      <ThemedView style={[styles.root, styles.centered]}>
        <ThemedText>{t("room.notFound")}</ThemedText>
      </ThemedView>
    );
  }

  if (loading && !room) {
    return (
      <ThemedView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={color.primary} />
      </ThemedView>
    );
  }

  if (!room) return null;

  return (
    <ThemedView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* IMAGE CAROUSEL */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {room.imageUrls.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={styles.image}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* FLOATING HEADER CONTROLS */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.iconBtn}>
              <View style={styles.glassBtn}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </View>
            </Pressable>

            {String(user?.id) === String(room.ownerId) && (
              <View style={styles.headerRight}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/room/edit",
                      params: { id: room.id },
                    })
                  }
                  style={styles.iconBtn}
                >
                  <View style={styles.glassBtn}>
                    <MaterialIcons name="edit" size={24} color="#fff" />
                  </View>
                </Pressable>

                <Pressable onPress={handleDelete} style={styles.iconBtn}>
                  <View style={styles.glassBtn}>
                    <MaterialIcons name="delete" size={24} color="#ff4444" />
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.title}>{room.title}</ThemedText>
            <ThemedText style={[styles.price, { color: color.primary }]}>
              {formatRoomPrice(room.price, t, locale)}
            </ThemedText>
          </View>

          <View
            style={[
              styles.hostRow,
              { backgroundColor: color.card, borderColor: color.border },
            ]}
          >
            <UserAvatar
              userId={room.ownerId}
              hintUrl={hostAvatarHint}
              name={hostName}
              size={52}
              style={styles.hostAvatar}
            />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.hostLabel, { color: color.textSecondary }]}>
                {t("room.detail.host")}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={{ color: color.text }} numberOfLines={1}>
                {hostLoading ? t("room.detail.hostLoading") : hostName || "—"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.matchSection}>
            <ProfileMatchSection
              targetUserId={room.ownerId}
              currentUserId={user?.id}
              hint={t("matching.hintWithOwner")}
            />
          </View>

          {/* ADDRESS */}
          <View style={styles.row}>
            <MaterialIcons name="location-on" size={20} color={color.icon} />
            <ThemedText style={styles.addressText}>{formatRoomAddress(room.address)}</ThemedText>
          </View>

          {/* INFO GRIDS */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: color.card }]}>
              <MaterialIcons name="square-foot" size={24} color={color.primary} />
              <ThemedText style={styles.infoTitle}>{t("room.detail.area")}</ThemedText>
              <ThemedText style={styles.infoValue}>{room.area} m²</ThemedText>
            </View>

            <View style={[styles.infoCard, { backgroundColor: color.card }]}>
              <MaterialIcons name="groups" size={24} color={color.primary} />
              <ThemedText style={styles.infoTitle}>{t("room.detail.capacity")}</ThemedText>
              <ThemedText style={styles.infoValue}>
                {t("room.detail.capacityValue", { count: room.capacity })}
              </ThemedText>
            </View>

            <View style={[styles.infoCard, { backgroundColor: color.card }]}>
              <MaterialIcons name="home" size={24} color={color.primary} />
              <ThemedText style={styles.infoTitle}>{t("room.detail.roomType")}</ThemedText>
              <ThemedText style={styles.infoValue}>
                {t(roomTypeLabelKey(room.roomType as RoomType))}
              </ThemedText>
            </View>
          </View>
          
          {/* DESCRIPTION */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t("room.detail.description")}
            </ThemedText>
            <ThemedText style={styles.descriptionText}>{room.description}</ThemedText>
          </View>

          {/* GENDER */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t("room.detail.tenantRequirement")}
            </ThemedText>
            <View style={[styles.pill, { backgroundColor: color.card }]}>
              <MaterialIcons name="person" size={20} color={color.icon} />
              <ThemedText style={styles.pillText}>
                {t(genderReqLabelKey(room.genderRequirement as GenderRequirement))}
              </ThemedText>
            </View>
          </View>

          {/* AMENITIES */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t("room.detail.amenities")}
            </ThemedText>
            <View style={styles.amenities}>
              {room.amenities.map((a) => (
                <View
                  key={a.id}
                  style={[styles.amenity, { backgroundColor: color.card, borderColor: color.border }]}
                >
                  <ThemedText style={styles.amenityText}>{a.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* BOTTOM SPACING */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  matchSection: {
    marginTop: -8,
    marginBottom: 8,
  },

  imageContainer: {
    position: "relative",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    boxShadow: "0px 8px 16px rgba(0,0,0,0.1)",
    zIndex: 1,
  },

  image: {
    width: width,
    height: 380,
  },

  header: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerRight: {
    flexDirection: "row",
    gap: 12,
  },

  iconBtn: {
    borderRadius: 22,
    overflow: "hidden",
  },

  glassBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },

  content: {
    padding: 24,
    gap: 24,
  },

  titleSection: {
    gap: 8,
  },

  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hostAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  hostLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  title: {
    fontSize: 26,
    lineHeight: 34,
  },

  price: {
    fontSize: 24,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -8,
  },

  addressText: {
    flex: 1,
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },

  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  infoCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    gap: 6,
  },

  infoTitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  section: {
    gap: 12,
  },

  sectionTitle: {
    fontSize: 20,
  },

  descriptionText: {
    fontSize: 16,
    lineHeight: 26,
    opacity: 0.8,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderCurve: "continuous",
    gap: 8,
  },

  pillText: {
    fontSize: 15,
    fontWeight: "600",
  },

  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  amenity: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
  },

  amenityText: {
    fontSize: 14,
    fontWeight: "500",
  },

  bottomSpacer: {
    height: 40,
  }
});