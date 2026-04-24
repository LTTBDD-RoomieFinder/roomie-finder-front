import { useCallback, useEffect, useState } from "react";
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
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLanguage } from "@/hooks/use-language";
import { verificationService } from "@/services/verification-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { VerificationStatus } from "@/types/enums";
import type { VerificationResponse } from "@/types/reputation";
// ── Constants ──────────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const IMG_H = 200;
/** Chiều cao sheet cố định để ScrollView bên trong có bound — tránh flex:1 vỡ trên Android/iOS. */
function detailSheetHeight() {
  return Math.min(SCREEN_H * 0.9, 680);
}

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

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminVerificationsScreen() {
  const { color, scheme } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  // ── Auth guard (screen-level, NOT layout-level) ────────────────────────────
  const isAdmin = useIsAdmin();
  const authInitialized = useAuthStore((s) => s.isInitialized);
  useEffect(() => {
    if (!authInitialized) return;
    if (!isAdmin) router.replace("/(tabs)/profile");
  }, [isAdmin, authInitialized]);

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  const headerSubtitle =
    items.length > 0
      ? t("adminVerify.headerCount", { count: items.length })
      : t("adminVerify.subtitle");

  return (
    <View style={[s.root, { backgroundColor: color.background }]}>
      {/* ─── Header (gọn, typography chuẩn dashboard) ───────────────── */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: color.card,
            borderBottomColor: color.border,
          },
        ]}
      >
        <View style={s.headerContent}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.goBack")}
            style={({ pressed }) => [
              s.headerIconBtn,
              { backgroundColor: color.backgroundSecondary },
              pressed && { opacity: 0.72 },
            ]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={color.text} />
          </Pressable>
          <View style={s.headerTextBlock}>
            <ThemedText style={[s.headerEyebrow, { color: color.textSecondary }]}>
              {t("adminVerify.headerEyebrow")}
            </ThemedText>
            <ThemedText style={[s.headerTitle, { color: color.text }]} numberOfLines={1}>
              {t("adminVerify.title")}
            </ThemedText>
            <ThemedText style={[s.headerSub, { color: color.textSecondary }]} numberOfLines={1}>
              {headerSubtitle}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              s.headerIconBtn,
              { backgroundColor: color.backgroundSecondary },
              pressed && { opacity: 0.72 },
            ]}
            onPress={() => fetchList(filter, true)}
            hitSlop={12}
          >
            <Ionicons name="refresh-outline" size={20} color={color.text} />
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
                onPress={() => {
                  void Haptics.selectionAsync();
                  setFilter(tab.key);
                }}
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
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={closeDetail}
      >
        <View style={s.modalRoot}>
          <Animated.View
            entering={FadeIn.duration(220)}
            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
          >
            <Pressable
              style={[s.modalBackdrop, StyleSheet.absoluteFill]}
              onPress={closeDetail}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={s.modalKeyboardWrap}
            pointerEvents="box-none"
          >
            {selected ? (
              <Animated.View
                entering={SlideInDown.springify().damping(22).stiffness(280).mass(0.85)}
                style={[
                  s.modalSheet,
                  {
                    backgroundColor: color.background,
                    height: detailSheetHeight(),
                    paddingBottom: insets.bottom + 12,
                  },
                ]}
              >
                <View style={s.modalHandleWrap}>
                  <View style={[s.modalHandle, { backgroundColor: color.border }]} />
                </View>

                <View style={[s.modalHeader, { borderBottomColor: color.border }]}>
                  <ThemedText style={[s.modalTitle, { color: color.text }]}>
                    {t("adminVerify.detailTitle")}
                  </ThemedText>
                  <Pressable
                    onPress={closeDetail}
                    style={({ pressed }) => [
                      s.modalCloseBtn,
                      { backgroundColor: pressed ? color.backgroundSecondary : "transparent" },
                    ]}
                    hitSlop={12}
                  >
                    <Ionicons name="close" size={22} color={color.textSecondary} />
                  </Pressable>
                </View>

                <ScrollView
                  style={s.modalScroll}
                  contentContainerStyle={s.modalBody}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  bounces
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
                    valueLines={6}
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
              </Animated.View>
            ) : null}
          </KeyboardAvoidingView>
        </View>
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

function InfoRow({
  label,
  value,
  color,
  valueLines = 4,
}: {
  label: string;
  value: string;
  color: any;
  valueLines?: number;
}) {
  return (
    <View style={s.infoRow}>
      <ThemedText style={[s.infoLabel, { color: color.textSecondary }]}>{label}</ThemedText>
      <ThemedText
        style={[s.infoValue, { color: color.text }]}
        numberOfLines={valueLines}
      >
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

  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBlock: { flex: 1, minWidth: 0, gap: 2 },
  headerEyebrow: { fontSize: 11, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
  headerTitle: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  headerSub: { fontSize: 12, fontWeight: "400", lineHeight: 16, marginTop: 1 },

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
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { backgroundColor: "rgba(0,0,0,0.48)" },
  modalKeyboardWrap: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 2,
    elevation: 24,
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  modalHandleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  modalHandle: { width: 36, height: 4, borderRadius: 2 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16, fontWeight: "600", letterSpacing: -0.1, flex: 1, marginRight: 8 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalScroll: { flex: 1 },
  modalBody: { padding: 18, gap: 14, paddingBottom: 28 },

  // Status banner
  statusBanner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14 },
  statusBannerIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  statusBannerTitle: { fontSize: 17, fontWeight: "700" },
  statusBannerSub: { fontSize: 13, marginTop: 2 },

  // Info card
  infoCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  infoRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  infoLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase" },
  infoValue: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
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
