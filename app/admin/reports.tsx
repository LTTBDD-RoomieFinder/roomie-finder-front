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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLanguage } from "@/hooks/use-language";
import { reportService } from "@/services/report-service";
import { useAuthStore } from "@/stores/useAuthStore";
import { ReportStatus } from "@/types/enums";
import type { ReportResponse } from "@/types/reputation";

const SCREEN_H = Dimensions.get("window").height;

type StatusFilter = ReportStatus | "ALL";

const FILTERS: { key: StatusFilter; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { key: "ALL", icon: "list-outline", labelKey: "adminReports.filterAll" },
  { key: ReportStatus.PENDING, icon: "time-outline", labelKey: "adminReports.filterPending" },
  { key: ReportStatus.REVIEWED, icon: "eye-outline", labelKey: "adminReports.filterReviewed" },
  { key: ReportStatus.DISMISSED, icon: "hand-left-outline", labelKey: "adminReports.filterDismissed" },
  { key: ReportStatus.ACTIONED, icon: "checkmark-done-outline", labelKey: "adminReports.filterActioned" },
];

const STATUS_COLOR: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "#F59E0B",
  [ReportStatus.REVIEWED]: "#3B82F6",
  [ReportStatus.DISMISSED]: "#9CA3AF",
  [ReportStatus.ACTIONED]: "#22C55E",
};

function sheetHeight() {
  return Math.min(SCREEN_H * 0.9, 720);
}

export default function AdminReportsScreen() {
  const { color, scheme } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  const isAdmin = useIsAdmin();
  const authInitialized = useAuthStore((s) => s.isInitialized);
  useEffect(() => {
    if (!authInitialized) return;
    if (!isAdmin) router.replace("/(tabs)/profile");
  }, [isAdmin, authInitialized]);

  const [filter, setFilter] = useState<StatusFilter>(ReportStatus.PENDING);
  const [items, setItems] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReportResponse | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(
    async (active: StatusFilter, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setFetchError(null);
      try {
        const status = active === "ALL" ? undefined : active;
        const list = await reportService.adminList(status);
        setItems(list);
      } catch (e: unknown) {
        const msg = typeof e === "string" ? e : (e as Error)?.message ?? t("common.error");
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

  const openDetail = (item: ReportResponse) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(item);
    setAdminNote(item.adminNote ?? "");
  };

  const closeDetail = () => {
    setSelected(null);
    setAdminNote("");
  };

  const submitStatus = async (next: ReportStatus) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await reportService.adminUpdate(selected.id, {
        status: next,
        adminNote: adminNote.trim() || null,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("common.success"), t("adminReports.updatedMsg"));
      closeDetail();
      fetchList(filter);
    } catch {
      Alert.alert(t("common.error"), t("adminReports.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: color.background }}>
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  const renderCard = ({ item }: { item: ReportResponse }) => {
    const fg = STATUS_COLOR[item.status];
    const catLabel = t(`report.category_${item.category}`);
    return (
      <Pressable
        onPress={() => openDetail(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: color.card,
            borderColor: color.border,
            borderLeftColor: fg,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText style={[styles.cardCat, { color: color.text }]} numberOfLines={2}>
              {catLabel}
            </ThemedText>
            <ThemedText style={[styles.cardMeta, { color: color.textSecondary }]}>
              #{item.id} · {t(`report.targetType_${item.targetType}`)} #{item.targetId}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: `${fg}22` }]}>
            <ThemedText style={[styles.badgeText, { color: fg }]}>
              {t(`report.status_${item.status}`)}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.cardPreview, { color: color.textSecondary }]} numberOfLines={2}>
          {item.details}
        </ThemedText>
        <View style={[styles.cardFoot, { borderTopColor: color.border }]}>
          <ThemedText style={[styles.cardDate, { color: color.textSecondary }]}>
            {new Date(item.createdAt).toLocaleString()}
          </ThemedText>
          <Ionicons name="chevron-forward" size={16} color={color.textSecondary} />
        </View>
      </Pressable>
    );
  };

  const headerSub =
    items.length > 0 ? t("adminReports.headerCount", { count: items.length }) : t("adminReports.subtitle");

  return (
    <View style={[styles.root, { backgroundColor: color.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: color.card,
            borderBottomColor: color.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.hBtn,
              { backgroundColor: color.backgroundSecondary },
              pressed && { opacity: 0.72 },
            ]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={color.text} />
          </Pressable>
          <View style={styles.headerTxt}>
            <ThemedText style={[styles.eyebrow, { color: color.textSecondary }]}>
              {t("adminHub.eyebrow")}
            </ThemedText>
            <ThemedText style={[styles.hTitle, { color: color.text }]}>{t("adminReports.title")}</ThemedText>
            <ThemedText style={[styles.hSub, { color: color.textSecondary }]}>{headerSub}</ThemedText>
          </View>
          <Pressable
            onPress={() => fetchList(filter, true)}
            style={({ pressed }) => [
              styles.hBtn,
              { backgroundColor: color.backgroundSecondary },
              pressed && { opacity: 0.72 },
            ]}
            hitSlop={12}
          >
            <Ionicons name="refresh-outline" size={20} color={color.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: color.background, borderBottomColor: color.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {FILTERS.map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tab,
                  active
                    ? { backgroundColor: color.primary, borderColor: color.primary }
                    : { backgroundColor: "transparent", borderColor: color.border },
                ]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setFilter(tab.key);
                }}
              >
                <Ionicons name={tab.icon} size={14} color={active ? "#fff" : color.textSecondary} />
                <ThemedText style={[styles.tabLbl, { color: active ? "#fff" : color.textSecondary }]}>
                  {t(tab.labelKey)}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color.primary} />
          <ThemedText style={{ color: color.textSecondary, marginTop: 12 }}>{t("common.loading")}</ThemedText>
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <ThemedText style={{ color: color.error, textAlign: "center" }}>{fetchError}</ThemedText>
          <TouchableOpacity
            onPress={() => fetchList(filter)}
            style={[styles.retry, { backgroundColor: color.primary }]}
          >
            <ThemedText style={styles.retryTxt}>{t("common.retry")}</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderCard}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchList(filter, true)} tintColor={color.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="file-tray-outline" size={48} color={color.border} />
              <ThemedText style={{ color: color.textSecondary, marginTop: 12 }}>{t("adminReports.empty")}</ThemedText>
            </View>
          }
        />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={closeDetail} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable style={[styles.dim, StyleSheet.absoluteFill]} onPress={closeDetail} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav} pointerEvents="box-none">
            {selected ? (
              <View
                style={[
                  styles.sheet,
                  { backgroundColor: color.background, height: sheetHeight(), paddingBottom: insets.bottom + 12 },
                ]}
              >
                <View style={styles.handleWrap}>
                  <View style={[styles.handle, { backgroundColor: color.border }]} />
                </View>
                <View style={[styles.sheetHead, { borderBottomColor: color.border }]}>
                  <ThemedText style={[styles.sheetTitle, { color: color.text }]}>{t("adminReports.detailTitle")}</ThemedText>
                  <Pressable onPress={closeDetail} hitSlop={12} style={styles.closeHit}>
                    <Ionicons name="close" size={24} color={color.textSecondary} />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetBody}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={[styles.banner, { backgroundColor: isDark ? "#2a2419" : "#fff7ed" }]}>
                    <ThemedText style={[styles.bannerStatus, { color: STATUS_COLOR[selected.status] }]}>
                      {t(`report.status_${selected.status}`)}
                    </ThemedText>
                    <ThemedText style={[styles.bannerMeta, { color: color.textSecondary }]}>
                      #{selected.id} · {t(`report.targetType_${selected.targetType}`)} #{selected.targetId}
                    </ThemedText>
                  </View>

                  <View style={[styles.info, { borderColor: color.border, backgroundColor: color.card }]}>
                    <Row label={t("adminReports.fieldReporter")} value={`#${selected.reporterId}`} color={color} />
                    <Divider color={color.border} />
                    <Row label={t("report.category")} value={t(`report.category_${selected.category}`)} color={color} />
                    <Divider color={color.border} />
                    <Row label={t("report.details")} value={selected.details || "—"} color={color} multiline />
                    <Divider color={color.border} />
                    <Row label={t("adminReports.fieldCreated")} value={new Date(selected.createdAt).toLocaleString()} color={color} />
                    {selected.reviewedAt ? (
                      <>
                        <Divider color={color.border} />
                        <Row
                          label={t("adminReports.fieldReviewed")}
                          value={new Date(selected.reviewedAt).toLocaleString()}
                          color={color}
                        />
                      </>
                    ) : null}
                  </View>

                  <ThemedText style={[styles.noteLbl, { color: color.textSecondary }]}>
                    {t("adminReports.adminNoteLabel")}
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.noteIn,
                      { backgroundColor: color.backgroundSecondary, borderColor: color.border, color: color.text },
                    ]}
                    placeholder={t("adminReports.adminNotePh")}
                    placeholderTextColor={color.placeholder}
                    value={adminNote}
                    onChangeText={setAdminNote}
                    multiline
                    maxLength={1000}
                  />

                  {selected.status === ReportStatus.PENDING ? (
                    <View style={styles.actions}>
                      <ThemedText style={[styles.actTitle, { color: color.textSecondary }]}>
                        {t("adminReports.resolveTitle")}
                      </ThemedText>
                      <View style={styles.actRow}>
                        <ActionChip
                          label={t("adminReports.btnReviewed")}
                          icon="eye-outline"
                          bg="#3B82F6"
                          onPress={() => submitStatus(ReportStatus.REVIEWED)}
                          disabled={submitting}
                        />
                        <ActionChip
                          label={t("adminReports.btnDismissed")}
                          icon="hand-left-outline"
                          bg="#9CA3AF"
                          onPress={() => submitStatus(ReportStatus.DISMISSED)}
                          disabled={submitting}
                        />
                        <ActionChip
                          label={t("adminReports.btnActioned")}
                          icon="checkmark-done-outline"
                          bg="#22C55E"
                          onPress={() => submitStatus(ReportStatus.ACTIONED)}
                          disabled={submitting}
                        />
                      </View>
                    </View>
                  ) : (
                    <ThemedText style={[styles.closedHint, { color: color.textSecondary }]}>
                      {t("adminReports.closedHint")}
                    </ThemedText>
                  )}
                </ScrollView>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function Row({
  label,
  value,
  color,
  multiline,
}: {
  label: string;
  value: string;
  color: { text: string; textSecondary: string };
  multiline?: boolean;
}) {
  return (
    <View style={styles.row}>
      <ThemedText style={[styles.rowLbl, { color: color.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.rowVal, { color: color.text }]} numberOfLines={multiline ? 12 : 3}>
        {value}
      </ThemedText>
    </View>
  );
}

function Divider({ color: bc }: { color: string }) {
  return <View style={[styles.div, { backgroundColor: bc }]} />;
}

function ActionChip({
  label,
  icon,
  bg,
  onPress,
  disabled,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: bg, opacity: disabled ? 0.55 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={16} color="#fff" />
      <ThemedText style={styles.chipTxt}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  hBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTxt: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  hTitle: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  hSub: { fontSize: 12, lineHeight: 16, marginTop: 1 },
  tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabLbl: { fontSize: 12, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardCat: { fontSize: 15, fontWeight: "600" },
  cardMeta: { fontSize: 12 },
  cardPreview: { fontSize: 13, lineHeight: 18 },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  cardDate: { fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  retry: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryTxt: { color: "#fff", fontWeight: "700" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  dim: { backgroundColor: "rgba(0,0,0,0.48)" },
  kav: { flex: 1, justifyContent: "flex-end", zIndex: 2, elevation: 20 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, width: "100%", overflow: "hidden" },
  handleWrap: { alignItems: "center", paddingTop: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: "600" },
  closeHit: { padding: 4 },
  sheetScroll: { flex: 1 },
  sheetBody: { padding: 18, gap: 12, paddingBottom: 32 },
  banner: { padding: 14, borderRadius: 14, gap: 4 },
  bannerStatus: { fontSize: 16, fontWeight: "700" },
  bannerMeta: { fontSize: 12 },
  info: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  rowLbl: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  rowVal: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  noteLbl: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  noteIn: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, minHeight: 72, textAlignVertical: "top" },
  actions: { gap: 10, marginTop: 4 },
  actTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  actRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  chipTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  closedHint: { fontSize: 13, lineHeight: 18, marginTop: 8, fontStyle: "italic" },
});
