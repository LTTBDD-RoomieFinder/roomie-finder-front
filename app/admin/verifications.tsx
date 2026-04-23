import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { verificationService } from "@/services/verification-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { VerificationStatus } from "@/types/enums";
import type { VerificationResponse } from "@/types/reputation";
import { decodeJwtPayload } from "@/utils/jwt";

// ── Constants ──────────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get("window").width;
const IMG_H = 200;

type StatusFilter = VerificationStatus | "ALL";
type ReviewAction = "approve" | "reject";

const FILTER_TABS: { key: StatusFilter; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { key: "ALL", icon: "list-outline", labelKey: "adminVerify.filterAll" },
  { key: VerificationStatus.PENDING, icon: "time-outline", labelKey: "adminVerify.filterPending" },
  { key: VerificationStatus.VERIFIED, icon: "checkmark-circle-outline", labelKey: "adminVerify.filterVerified" },
  { key: VerificationStatus.REJECTED, icon: "close-circle-outline", labelKey: "adminVerify.filterRejected" },
];

const STATUS_META: Record<VerificationStatus, { icon: string; bgLight: string; bgDark: string; fg: string }> = {
  [VerificationStatus.PENDING]: { icon: "⏳", bgLight: "#FFF8E1", bgDark: "#3d3520", fg: "#F59E0B" },
  [VerificationStatus.VERIFIED]: { icon: "✓", bgLight: "#E8F5E9", bgDark: "#1b3326", fg: "#4CAF50" },
  [VerificationStatus.REJECTED]: { icon: "✕", bgLight: "#FFEBEE", bgDark: "#3b1f1f", fg: "#EF5350" },
  [VerificationStatus.EXPIRED]: { icon: "⚠", bgLight: "#F5F5F5", bgDark: "#2a2a2a", fg: "#9E9E9E" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function useIsAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMemo(() => {
    if (user?.roles?.includes("ADMIN")) return true;
    if (!accessToken) return false;
    const jwt = decodeJwtPayload(accessToken);
    if (!jwt) return false;
    if (jwt.scope === "ADMIN") return true;
    if (Array.isArray(jwt.roles) && (jwt.roles as string[]).includes("ADMIN")) return true;
    return false;
  }, [user, accessToken]);
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminVerificationsScreen() {
  const { color, scheme } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  // ── Auth guard (screen-level, NOT layout-level) ────────────────────────────
  const isAdmin = useIsAdmin();
  useEffect(() => {
    if (!isAdmin) router.replace("/(tabs)/profile");
  }, [isAdmin]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<StatusFilter>("PENDING" as StatusFilter);
  const [items, setItems] = useState<VerificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<VerificationResponse | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchList = useCallback(
    async (activeFilter: StatusFilter, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setFetchError(null);
      try {
        const status = activeFilter === "ALL" ? undefined : activeFilter;
        const list = await verificationService.adminList(status);
        setItems(list);
      } catch (e: any) {
        const msg = typeof e === "string" ? e : e?.message ?? t("common.error");
        setFetchError(msg);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (isAdmin) fetchList(filter);
  }, [filter, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) fetchList(filter);
    }, [filter, isAdmin]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  const openDetail = (item: VerificationResponse) => {
    setSelected(item);
    setReviewAction(null);
    setReviewNote("");
  };
  const closeDetail = () => {
    setSelected(null);
    setReviewAction(null);
    setReviewNote("");
  };

  const submitReview = async () => {
    if (!selected || !reviewAction) return;
    if (reviewAction === "reject" && !reviewNote.trim()) {
      Alert.alert(t("adminVerify.noteRequired"), t("adminVerify.noteRequiredMsg"));
      return;
    }
    setSubmitting(true);
    try {
      await verificationService.adminReview(selected.id, {
        status: reviewAction === "approve" ? "VERIFIED" : "REJECTED",
        reviewNote: reviewNote.trim() || null,
      });
      Alert.alert(
        t("common.success"),
        reviewAction === "approve" ? t("adminVerify.approvedMsg") : t("adminVerify.rejectedMsg"),
      );
      closeDetail();
      fetchList(filter);
    } catch {
      Alert.alert(t("common.error"), t("adminVerify.reviewFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Early return for non-admin ─────────────────────────────────────────
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.background }}>
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  // ── Counts per status for tab badges ────────────────────────────────────
  const pendingCount = items.filter((i) => i.status === VerificationStatus.PENDING).length;

  // ── Status chip ─────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: VerificationStatus }) => {
    const meta = STATUS_META[status];
    return (
      <View style={[s.statusBadge, { backgroundColor: isDark ? meta.bgDark : meta.bgLight }]}>
        <ThemedText style={[s.statusBadgeIcon, { color: meta.fg }]}>{meta.icon}</ThemedText>
        <ThemedText style={[s.statusBadgeLabel, { color: meta.fg }]}>
          {t(`verification.status.${status}`)}
        </ThemedText>
      </View>
    );
  };

  // ── List card ────────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: VerificationResponse }) => {
    const meta = STATUS_META[item.status];
    return (
      <Pressable
        style={({ pressed }) => [
          s.card,
          {
            backgroundColor: color.card,
            borderColor: color.border,
            borderLeftColor: meta.fg,
            borderLeftWidth: 3,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
        onPress={() => openDetail(item)}
      >
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={[s.cardDocNum, { color: color.text }]}>
                {item.documentNumber || item.documentNumberMasked || t("adminVerify.noDocNum")}
              </ThemedText>
              <ThemedText style={[s.cardSub, { color: color.textSecondary }]}>
                #{item.id} · User #{item.userId}
              </ThemedText>
            </View>
            <StatusBadge status={item.status} />
          </View>

          <View style={[s.cardFooter, { borderTopColor: color.border }]}>
            <View style={s.cardFooterItem}>
              <Ionicons name="calendar-outline" size={13} color={color.textSecondary} />
              <ThemedText style={[s.cardFooterText, { color: color.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
            {item.verifiedAt && (
              <View style={s.cardFooterItem}>
                <Ionicons name="checkmark-done-outline" size={13} color={meta.fg} />
                <ThemedText style={[s.cardFooterText, { color: meta.fg }]}>
                  {new Date(item.verifiedAt).toLocaleDateString()}
                </ThemedText>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={16} color={color.textSecondary} />
          </View>
        </View>
      </Pressable>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: color.background }]}>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: color.primary }]}>
        <View style={s.headerContent}>
          <Pressable
            style={({ pressed }) => [s.headerBackBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={color.primaryText} />
          </Pressable>
          <View style={[s.headerIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="shield-checkmark" size={28} color={color.primaryText} />
          </View>
          <View style={s.headerTextWrap}>
            <ThemedText style={[s.headerTitle, { color: color.primaryText }]}>
              {t("adminVerify.title")}
            </ThemedText>
            <ThemedText style={[s.headerSub, { color: color.primaryText, opacity: 0.9 }]}>
              {items.length > 0
                ? `${items.length} ${t("adminVerify.filterAll").toLowerCase()}`
                : t("adminVerify.subtitle")}
            </ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [s.headerBackBtn, pressed && { opacity: 0.7 }]}
            onPress={() => fetchList(filter, true)}
            hitSlop={12}
          >
            <Ionicons name="refresh" size={20} color={color.primaryText} />
          </Pressable>
        </View>
      </View>

      {/* ─── Filter tabs ────────────────────────────────────────── */}
      <View style={[s.tabBar, { backgroundColor: color.background, borderBottomColor: color.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  s.tab,
                  active
                    ? { backgroundColor: color.primary, borderColor: color.primary }
                    : { backgroundColor: "transparent", borderColor: color.border },
                ]}
                onPress={() => setFilter(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={active ? "#fff" : color.textSecondary}
                />
                <ThemedText
                  style={[
                    s.tabLabel,
                    { color: active ? "#fff" : color.textSecondary },
                  ]}
                >
                  {t(tab.labelKey)}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Content ────────────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={s.centeredBox}>
          <ActivityIndicator size="large" color={color.primary} />
          <ThemedText style={[s.centeredText, { color: color.textSecondary }]}>
            {t("common.loading")}
          </ThemedText>
        </View>
      ) : fetchError ? (
        <View style={s.centeredBox}>
          <View style={[s.errorCircle, { backgroundColor: color.error + "18" }]}>
            <Ionicons name="alert-circle" size={40} color={color.error} />
          </View>
          <ThemedText style={[s.centeredText, { color: color.error, marginTop: 16 }]}>
            {fetchError}
          </ThemedText>
          <TouchableOpacity
            onPress={() => fetchList(filter)}
            style={[s.retryBtn, { backgroundColor: color.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <ThemedText style={s.retryBtnText}>{t("common.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent, items.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchList(filter, true)}
              tintColor={color.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.centeredBox}>
              <View style={[s.emptyCircle, { backgroundColor: color.backgroundSecondary }]}>
                <Ionicons name="shield-checkmark-outline" size={44} color={color.border} />
              </View>
              <ThemedText style={[s.centeredText, { color: color.textSecondary, marginTop: 16 }]}>
                {t("adminVerify.empty")}
              </ThemedText>
            </View>
          }
        />
      )}

      {/* ════════════════ DETAIL MODAL ════════════════════════════════ */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={closeDetail}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[s.modalOverlay]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDetail} />
          <View style={[s.modalSheet, { backgroundColor: color.background, paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={s.modalHandleWrap}>
              <View style={[s.modalHandle, { backgroundColor: color.border }]} />
            </View>

            {/* Modal Header */}
            <View style={[s.modalHeader, { borderBottomColor: color.border }]}>
              <ThemedText style={[s.modalTitle, { color: color.text }]}>
                {t("adminVerify.detailTitle")}
              </ThemedText>
              <Pressable
                onPress={closeDetail}
                style={({ pressed }) => [s.modalCloseBtn, { backgroundColor: pressed ? color.backgroundSecondary : "transparent" }]}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={color.textSecondary} />
              </Pressable>
            </View>

            {selected && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={s.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* ── Status banner ─── */}
                <View style={[s.statusBanner, { backgroundColor: isDark ? STATUS_META[selected.status].bgDark : STATUS_META[selected.status].bgLight }]}>
                  <View style={[s.statusBannerIcon, { backgroundColor: STATUS_META[selected.status].fg + "22" }]}>
                    <ThemedText style={{ fontSize: 22 }}>{STATUS_META[selected.status].icon}</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[s.statusBannerTitle, { color: STATUS_META[selected.status].fg }]}>
                      {t(`verification.status.${selected.status}`)}
                    </ThemedText>
                    <ThemedText style={[s.statusBannerSub, { color: color.textSecondary }]}>
                      ID #{selected.id} · User #{selected.userId}
                    </ThemedText>
                  </View>
                </View>

                {/* ── Info grid ─── */}
                <View style={[s.infoCard, { backgroundColor: color.card, borderColor: color.border }]}>
                  <InfoRow
                    label={t("adminVerify.fieldDocNum")}
                    value={selected.documentNumber || selected.documentNumberMasked || "—"}
                    color={color}
                  />
                  <View style={[s.infoDivider, { backgroundColor: color.border }]} />
                  <InfoRow label={t("adminVerify.fieldSubmitted")} value={new Date(selected.createdAt).toLocaleString()} color={color} />
                  {selected.verifiedAt && (
                    <>
                      <View style={[s.infoDivider, { backgroundColor: color.border }]} />
                      <InfoRow label={t("adminVerify.fieldVerifiedAt")} value={new Date(selected.verifiedAt).toLocaleString()} color={color} />
                    </>
                  )}
                </View>

                {/* ── Previous note ─── */}
                {selected.reviewNote && (
                  <View style={[s.noteCard, { backgroundColor: isDark ? "#2a2a1f" : "#FFFDE7", borderColor: "#F59E0B40" }]}>
                    <View style={s.noteCardHeader}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#F59E0B" />
                      <ThemedText style={s.noteCardTitle}>{t("adminVerify.previousNote")}</ThemedText>
                    </View>
                    <ThemedText style={[s.noteCardBody, { color: color.text }]}>{selected.reviewNote}</ThemedText>
                  </View>
                )}

                {/* ── Document images ─── */}
                {(selected.documentImageUrl || selected.documentBackImageUrl || selected.selfieImageUrl) && (
                  <View style={s.imagesSection}>
                    <ThemedText style={[s.sectionLabel, { color: color.textSecondary }]}>
                      {t("adminVerify.imagesTitle")}
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imagesScroll}>
                      {selected.documentImageUrl && (
                        <ImageCard
                          uri={selected.documentImageUrl}
                          label={t("adminVerify.imgFront")}
                          color={color}
                          isDark={isDark}
                          onPress={() => setFullScreenImg(selected.documentImageUrl!)}
                        />
                      )}
                      {selected.documentBackImageUrl && (
                        <ImageCard
                          uri={selected.documentBackImageUrl}
                          label={t("adminVerify.imgBack")}
                          color={color}
                          isDark={isDark}
                          onPress={() => setFullScreenImg(selected.documentBackImageUrl!)}
                        />
                      )}
                      {selected.selfieImageUrl && (
                        <ImageCard
                          uri={selected.selfieImageUrl}
                          label={t("adminVerify.imgSelfie")}
                          color={color}
                          isDark={isDark}
                          onPress={() => setFullScreenImg(selected.selfieImageUrl!)}
                        />
                      )}
                    </ScrollView>
                  </View>
                )}

                {/* ── Action area (PENDING only) ─── */}
                {selected.status === VerificationStatus.PENDING && (
                  <View style={s.actionSection}>
                    <ThemedText style={[s.sectionLabel, { color: color.textSecondary }]}>
                      {t("adminVerify.actionTitle")}
                    </ThemedText>

                    {!reviewAction ? (
                      <View style={s.actionRow}>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: "#4CAF50" }]}
                          onPress={() => { setReviewAction("approve"); setReviewNote(""); }}
                          activeOpacity={0.82}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <ThemedText style={s.actionBtnText}>{t("adminVerify.approve")}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: "#EF5350" }]}
                          onPress={() => { setReviewAction("reject"); setReviewNote(""); }}
                          activeOpacity={0.82}
                        >
                          <Ionicons name="close-circle" size={20} color="#fff" />
                          <ThemedText style={s.actionBtnText}>{t("adminVerify.reject")}</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={s.reviewForm}>
                        <ThemedText style={[s.reviewFormLabel, { color: color.text }]}>
                          {reviewAction === "reject"
                            ? t("adminVerify.rejectNoteLabel")
                            : t("adminVerify.approveNoteLabel")}
                        </ThemedText>
                        <TextInput
                          style={[s.noteInput, { backgroundColor: color.backgroundSecondary, borderColor: color.border, color: color.text }]}
                          placeholder={
                            reviewAction === "reject"
                              ? t("adminVerify.notePlaceholderReject")
                              : t("adminVerify.notePlaceholderApprove")
                          }
                          placeholderTextColor={color.placeholder}
                          value={reviewNote}
                          onChangeText={setReviewNote}
                          multiline
                          maxLength={500}
                        />
                        <TouchableOpacity
                          style={[s.submitBtn, { backgroundColor: reviewAction === "approve" ? "#4CAF50" : "#EF5350" }]}
                          onPress={submitReview}
                          activeOpacity={0.82}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons
                                name={reviewAction === "approve" ? "checkmark-circle" : "close-circle"}
                                size={18}
                                color="#fff"
                              />
                              <ThemedText style={s.actionBtnText}>
                                {reviewAction === "approve"
                                  ? t("adminVerify.confirmApprove")
                                  : t("adminVerify.confirmReject")}
                              </ThemedText>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.cancelReviewBtn, { backgroundColor: color.backgroundSecondary }]}
                          onPress={() => setReviewAction(null)}
                          activeOpacity={0.82}
                          disabled={submitting}
                        >
                          <ThemedText style={[s.cancelReviewText, { color: color.textSecondary }]}>
                            {t("common.cancel")}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════ FULLSCREEN IMAGE VIEWER ══════════════════════ */}
      <Modal
        visible={!!fullScreenImg}
        animationType="fade"
        transparent
        onRequestClose={() => setFullScreenImg(null)}
      >
        <View style={s.fullImgOverlay}>
          <Pressable style={s.fullImgClose} onPress={() => setFullScreenImg(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </Pressable>
          {fullScreenImg && (
            <Image
              source={{ uri: fullScreenImg }}
              style={s.fullImg}
              contentFit="contain"
              transition={200}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function InfoRow({ label, value, color }: { label: string; value: string; color: any }) {
  return (
    <View style={s.infoRow}>
      <ThemedText style={[s.infoLabel, { color: color.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[s.infoValue, { color: color.text }]} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

function ImageCard({
  uri,
  label,
  color,
  isDark,
  onPress,
}: {
  uri: string;
  label: string;
  color: any;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.imgCard, pressed && { opacity: 0.85 }]}>
      <Image source={{ uri }} style={s.imgCardImage} contentFit="cover" transition={200} />
      <View style={[s.imgCardLabel, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.88)" }]}>
        <ThemedText style={[s.imgCardLabelText, { color: color.text }]}>{label}</ThemedText>
        <Ionicons name="expand-outline" size={12} color={color.textSecondary} />
      </View>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Header — synced with Profile / Chats / Requests / Map pattern
  header: {
    height: 100,
    marginTop: 40,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "700", letterSpacing: 0.3 },
  headerSub: { fontSize: 14, marginTop: 4, lineHeight: 20 },

  // Tabs
  tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabLabel: { fontSize: 13, fontWeight: "600" },

  // List
  listContent: { padding: 16, gap: 10 },

  // Card
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardBody: { padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardDocNum: { fontSize: 16, fontWeight: "700", letterSpacing: 0.4 },
  cardSub: { fontSize: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  cardFooterItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardFooterText: { fontSize: 12 },

  // Status badge
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeIcon: { fontSize: 11 },
  statusBadgeLabel: { fontSize: 12, fontWeight: "600" },

  // Centered
  centeredBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  centeredText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  errorCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "94%", overflow: "hidden" },
  modalHandleWrap: { alignItems: "center", paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalBody: { padding: 20, gap: 16, paddingBottom: 40 },

  // Status banner
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14 },
  statusBannerIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  statusBannerTitle: { fontSize: 17, fontWeight: "700" },
  statusBannerSub: { fontSize: 13, marginTop: 2 },

  // Info card
  infoCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right", maxWidth: "60%" },
  infoDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  // Note card
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  noteCardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  noteCardTitle: { fontSize: 13, fontWeight: "700", color: "#F59E0B" },
  noteCardBody: { fontSize: 14, lineHeight: 20 },

  // Images
  imagesSection: { gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  imagesScroll: { gap: 10 },
  imgCard: { width: SCREEN_W * 0.55, borderRadius: 14, overflow: "hidden", backgroundColor: "#E5E7EB" },
  imgCardImage: { width: "100%", height: IMG_H },
  imgCardLabel: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8 },
  imgCardLabelText: { fontSize: 12, fontWeight: "600" },

  // Actions
  actionSection: { gap: 12 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reviewForm: { gap: 12 },
  reviewFormLabel: { fontSize: 14, fontWeight: "600" },
  noteInput: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, fontSize: 15, minHeight: 90, textAlignVertical: "top" },
  submitBtn: { height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  cancelReviewBtn: { height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelReviewText: { fontWeight: "600", fontSize: 14 },

  // Fullscreen image
  fullImgOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  fullImgClose: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  fullImg: { width: SCREEN_W, height: SCREEN_W * 1.4 },
});
