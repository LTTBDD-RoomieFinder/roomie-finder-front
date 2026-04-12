import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { VerificationStatusChip } from "@/components/reputation/verification-status-chip";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { verificationService } from "@/services/verification-service";
import { VerificationStatus } from "@/types/enums";
import type { VerificationResponse } from "@/types/reputation";
import { router } from "expo-router";

type StatusFilter = VerificationStatus | "ALL";

const TABS: { key: StatusFilter; labelKey: string }[] = [
  { key: "ALL", labelKey: "adminVerify.filterAll" },
  { key: VerificationStatus.PENDING, labelKey: "adminVerify.filterPending" },
  { key: VerificationStatus.VERIFIED, labelKey: "adminVerify.filterVerified" },
  { key: VerificationStatus.REJECTED, labelKey: "adminVerify.filterRejected" },
];

type ReviewAction = "approve" | "reject";

export default function AdminVerificationsScreen() {
  const { color, scheme, radius } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [items, setItems] = useState<VerificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Detail/review modal
  const [selected, setSelected] = useState<VerificationResponse | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDark = scheme === "dark";

  // Normalize the API response — backend may return a raw array, a paged object
  // { content: [...] }, or still wrapped { data: [...] }
  function extractList(raw: unknown): VerificationResponse[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      if (Array.isArray(r.content)) return r.content as VerificationResponse[];
      if (Array.isArray(r.data)) return r.data as VerificationResponse[];
    }
    return [];
  }

  const fetchList = useCallback(async (activeFilter: StatusFilter, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);
    try {
      const status = activeFilter === "ALL" ? undefined : activeFilter;
      const raw = await verificationService.adminList(status);
      setItems(extractList(raw));
    } catch (e: any) {
      const msg = typeof e === "string" ? e : e?.message ?? t("common.error");
      setFetchError(msg);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // Re-fetch when filter tab changes
  useEffect(() => {
    fetchList(filter);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also re-fetch every time the screen gains focus (e.g. back from background)
  useFocusEffect(useCallback(() => { fetchList(filter); }, [filter])); // eslint-disable-line react-hooks/exhaustive-deps




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

  const startAction = (action: ReviewAction) => {
    setReviewAction(action);
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

  // ── Styles ──────────────────────────────────────────────────────────────────
  const styles = StyleSheet.create({
    safeHeader: {
      backgroundColor: color.primary,
      paddingTop: insets.top,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    backBtn: {
      padding: 4,
      borderRadius: 20,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
      flex: 1,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: color.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: color.textSecondary,
    },
    tabTextActive: {
      color: color.primary,
    },
    tabIndicator: {
      position: "absolute",
      bottom: 0,
      left: 8,
      right: 8,
      height: 2,
      borderRadius: 1,
      backgroundColor: color.primary,
    },
    list: {
      flex: 1,
      backgroundColor: color.background,
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    card: {
      backgroundColor: color.card,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      padding: 16,
      gap: 10,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
        android: { elevation: 2 },
      }),
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardMeta: {
      gap: 4,
      flex: 1,
    },
    cardId: {
      fontSize: 12,
      color: color.textSecondary,
    },
    cardDocNum: {
      fontSize: 15,
      fontWeight: "600",
      color: color.text,
    },
    cardDate: {
      fontSize: 12,
      color: color.textSecondary,
    },
    chevron: {
      marginLeft: 8,
    },
    // ── Detail modal ──
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: color.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: insets.bottom + 16,
      maxHeight: "92%",
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: color.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 4,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    modalBody: {
      padding: 20,
      gap: 16,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    infoLabel: {
      fontSize: 13,
      color: color.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: color.text,
      flexShrink: 1,
      textAlign: "right",
    },
    imageGrid: {
      flexDirection: "row",
      gap: 10,
    },
    imageBox: {
      flex: 1,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: color.backgroundSecondary,
    },
    imageBoxLabel: {
      fontSize: 11,
      color: color.textSecondary,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 4,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    verifyImg: {
      width: "100%",
      height: 140,
    },
    noteInput: {
      backgroundColor: color.backgroundSecondary,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.border,
      padding: 12,
      fontSize: 15,
      color: color.text,
      minHeight: 80,
      textAlignVertical: "top",
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
    },
    approveBtn: {
      flex: 1,
      backgroundColor: color.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    rejectBtn: {
      flex: 1,
      backgroundColor: color.error + "18",
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: color.error,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    confirmBtn: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    cancelBtn: {
      backgroundColor: color.backgroundSecondary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    btnText: {
      fontWeight: "700",
      fontSize: 15,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: color.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    reviewedNote: {
      backgroundColor: isDark ? "#2a2a1f" : "#fffbe6",
      borderRadius: 10,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: "#f59e0b",
    },
  });

  const renderCard = ({ item }: { item: VerificationResponse }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => openDetail(item)}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardMeta}>
          <ThemedText style={styles.cardId}>ID #{item.id} · User #{item.userId}</ThemedText>
          <ThemedText style={styles.cardDocNum}>
            {item.documentNumberMasked || t("adminVerify.noDocNum")}
          </ThemedText>
          <ThemedText style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </ThemedText>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <VerificationStatusChip status={item.status} />
          <Ionicons name="chevron-forward" size={16} color={color.textSecondary} style={styles.chevron} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      {/* Header */}
      <View style={styles.safeHeader}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{t("adminVerify.title")}</ThemedText>
          <Pressable onPress={() => fetchList(filter, true)}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => setFilter(tab.key)}
            >
              <ThemedText style={[styles.tabText, active && styles.tabTextActive]}>
                {t(tab.labelKey)}
              </ThemedText>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={color.primary} />
          <ThemedText style={{ color: color.textSecondary, marginTop: 12 }}>{t("common.loading")}</ThemedText>
        </View>
      ) : fetchError ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={52} color={color.error} />
          <ThemedText style={{ color: color.error, fontSize: 14, textAlign: "center", marginTop: 12, paddingHorizontal: 24 }}>
            {fetchError}
          </ThemedText>
          <TouchableOpacity
            onPress={() => fetchList(filter)}
            style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: color.primary, borderRadius: 20 }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>{t("common.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          style={styles.list}
          contentContainerStyle={[styles.listContent, items.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchList(filter, true)} tintColor={color.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={52} color={color.border} />
              <ThemedText style={{ color: color.textSecondary, fontSize: 15 }}>
                {t("adminVerify.empty")}
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Detail / Review modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={closeDetail}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t("adminVerify.detailTitle")}</ThemedText>
              <Pressable onPress={closeDetail}>
                <Ionicons name="close" size={24} color={color.textSecondary} />
              </Pressable>
            </View>

            {selected && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                {/* Status + basic info */}
                <View style={{ gap: 10 }}>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t("adminVerify.fieldId")}</ThemedText>
                    <ThemedText style={styles.infoValue}>#{selected.id}</ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t("adminVerify.fieldUserId")}</ThemedText>
                    <ThemedText style={styles.infoValue}>#{selected.userId}</ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t("adminVerify.fieldDocNum")}</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {selected.documentNumberMasked || "—"}
                    </ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t("adminVerify.fieldStatus")}</ThemedText>
                    <VerificationStatusChip status={selected.status} />
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>{t("adminVerify.fieldSubmitted")}</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {new Date(selected.createdAt).toLocaleString()}
                    </ThemedText>
                  </View>
                  {selected.verifiedAt && (
                    <View style={styles.infoRow}>
                      <ThemedText style={styles.infoLabel}>{t("adminVerify.fieldVerifiedAt")}</ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {new Date(selected.verifiedAt).toLocaleString()}
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Review note (if already reviewed) */}
                {selected.reviewNote && (
                  <View style={styles.reviewedNote}>
                    <ThemedText style={{ fontSize: 13, fontWeight: "600", color: "#92400e", marginBottom: 4 }}>
                      {t("adminVerify.previousNote")}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, color: "#92400e" }}>{selected.reviewNote}</ThemedText>
                  </View>
                )}

                {/* Document images */}
                {(selected.documentImageUrl || selected.documentBackImageUrl || selected.selfieImageUrl) && (
                  <View style={{ gap: 8 }}>
                    <ThemedText style={styles.sectionLabel}>{t("adminVerify.imagesTitle")}</ThemedText>
                    <View style={styles.imageGrid}>
                      {selected.documentImageUrl && (
                        <View style={styles.imageBox}>
                          <ThemedText style={styles.imageBoxLabel}>{t("adminVerify.imgFront")}</ThemedText>
                          <Image
                            source={{ uri: selected.documentImageUrl }}
                            style={styles.verifyImg}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selected.documentBackImageUrl && (
                        <View style={styles.imageBox}>
                          <ThemedText style={styles.imageBoxLabel}>{t("adminVerify.imgBack")}</ThemedText>
                          <Image
                            source={{ uri: selected.documentBackImageUrl }}
                            style={styles.verifyImg}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selected.selfieImageUrl && (
                        <View style={styles.imageBox}>
                          <ThemedText style={styles.imageBoxLabel}>{t("adminVerify.imgSelfie")}</ThemedText>
                          <Image
                            source={{ uri: selected.selfieImageUrl }}
                            style={styles.verifyImg}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Action area (only for PENDING) */}
                {selected.status === VerificationStatus.PENDING && (
                  <View style={{ gap: 12 }}>
                    <ThemedText style={styles.sectionLabel}>{t("adminVerify.actionTitle")}</ThemedText>

                    {!reviewAction ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => startAction("approve")} activeOpacity={0.82}>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <ThemedText style={[styles.btnText, { color: "#fff" }]}>{t("adminVerify.approve")}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => startAction("reject")} activeOpacity={0.82}>
                          <Ionicons name="close-circle" size={18} color={color.error} />
                          <ThemedText style={[styles.btnText, { color: color.error }]}>{t("adminVerify.reject")}</ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ gap: 12 }}>
                        <ThemedText style={{ fontSize: 14, color: color.text }}>
                          {reviewAction === "reject"
                            ? t("adminVerify.rejectNoteLabel")
                            : t("adminVerify.approveNoteLabel")}
                        </ThemedText>
                        <TextInput
                          style={styles.noteInput}
                          placeholder={reviewAction === "reject" ? t("adminVerify.notePlaceholderReject") : t("adminVerify.notePlaceholderApprove")}
                          placeholderTextColor={color.placeholder}
                          value={reviewNote}
                          onChangeText={setReviewNote}
                          multiline
                          maxLength={500}
                        />
                        <TouchableOpacity
                          style={[styles.confirmBtn, { backgroundColor: reviewAction === "approve" ? color.primary : color.error }]}
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
                              <ThemedText style={[styles.btnText, { color: "#fff" }]}>
                                {reviewAction === "approve" ? t("adminVerify.confirmApprove") : t("adminVerify.confirmReject")}
                              </ThemedText>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setReviewAction(null)}
                          activeOpacity={0.82}
                          disabled={submitting}
                        >
                          <ThemedText style={[styles.btnText, { color: color.textSecondary }]}>{t("common.cancel")}</ThemedText>
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
    </View>
  );
}
