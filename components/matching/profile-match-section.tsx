import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { matchingService } from "@/services/matching-service";
import type { MatchDetailResponse } from "@/types/matching";

/** Chiều cao vùng danh sách tiêu chí: đủ lớn + vẫn còn chỗ cho header modal. */
function breakdownScrollMaxHeight(): number {
  const h = Dimensions.get("window").height;
  return Math.min(520, Math.round(h * 0.52));
}

function formatMatchPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const s = Number(score);
  if (s >= 0 && s <= 1) return Math.round(s * 100);
  return Math.min(100, Math.max(0, Math.round(s)));
}

/** Điểm từng tiêu chí (0–100), làm tròn để hiển thị. */
function criterionPercent(raw: number | null | undefined): number | null {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  return Math.min(100, Math.max(0, Math.round(Number(raw))));
}

/**
 * Trọng số 1–5 (backend) → mô tả dễ hiểu (không hiển thị số thô).
 */
function importanceDescription(
  weight: number | null | undefined,
  t: (k: string) => string,
): string | null {
  if (weight == null || Number.isNaN(Number(weight))) return null;
  const w = Number(weight);
  if (w >= 4.5) return t("matching.importanceVeryHigh");
  if (w >= 3.5) return t("matching.importanceHigh");
  if (w >= 2.5) return t("matching.importanceMedium");
  if (w >= 1.5) return t("matching.importanceLow");
  return t("matching.importanceExtra");
}

/** Backend ErrorCode.PROFILE_NOT_FOUND — axios interceptor chỉ trả message string. */
function isProfileNotFoundError(e: unknown): boolean {
  if (typeof e !== "string") return false;
  return /profile\s+not\s+found/i.test(e.trim());
}

type Props = {
  /** User id (account) to compare the current user against. */
  targetUserId: number | string | null | undefined;
  /** Current logged-in user id — hides section when same as target. */
  currentUserId?: number | string | null;
  /** Line under the title; falls back to `matching.defaultHint`. */
  hint?: string;
};

export function ProfileMatchSection({
  targetUserId,
  currentUserId,
  hint,
}: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const hintLine = hint ?? t("matching.defaultHint");
  const [detail, setDetail] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  /** Ẩn cả khối khi API báo không có profile (mình hoặc đối phương). */
  const [hideSection, setHideSection] = useState(false);

  const tid =
    targetUserId === null || targetUserId === undefined
      ? NaN
      : Number(targetUserId);
  const cid =
    currentUserId === null || currentUserId === undefined
      ? null
      : Number(currentUserId);

  const shouldShow = Number.isFinite(tid) && tid > 0 && cid !== tid;

  const load = useCallback(async () => {
    if (!shouldShow) {
      setDetail(null);
      setError(null);
      setHideSection(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await matchingService.getMatchDetail(tid);
      setDetail(res);
      setHideSection(false);
    } catch (e) {
      setDetail(null);
      if (isProfileNotFoundError(e)) {
        setHideSection(true);
        setError(null);
      } else {
        setHideSection(false);
        setError(
          typeof e === "string"
            ? e
            : t("matching.loadError"),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [shouldShow, tid, t]);

  useEffect(() => {
    setHideSection(false);
  }, [tid]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!shouldShow || hideSection) {
    return null;
  }

  const pct = formatMatchPercent(detail?.totalScore);
  const label = detail?.label?.trim() || "";
  const breakdownList = detail?.breakdown ?? [];

  return (
    <>
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: color.primary + "12",
            borderColor: color.primary + "35",
          },
        ]}
      >
        <View style={styles.rowTop}>
          <Ionicons name="sparkles" size={20} color={color.primary} />
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {t("matching.title")}
          </ThemedText>
        </View>
        <ThemedText style={[styles.hint, { color: color.textSecondary }]}>
          {hintLine}
        </ThemedText>

        {loading ? (
          <View style={styles.centerRow}>
            <ActivityIndicator color={color.primary} />
            <ThemedText style={{ color: color.textSecondary, marginLeft: 8 }}>
              {t("matching.computing")}
            </ThemedText>
          </View>
        ) : error ? (
          <ThemedText style={{ color: color.error, fontSize: 14 }}>
            {error}
          </ThemedText>
        ) : (
          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.scoreRow,
              {
                backgroundColor: pressed ? color.backgroundSecondary : color.card,
                borderColor: color.border + "55",
              },
            ]}
          >
            <View style={styles.scoreLeft}>
              <ThemedText style={[styles.percent, { color: color.primary }]}>
                {pct}%
              </ThemedText>
              {label ? (
                <ThemedText
                  style={[styles.labelBadge, { color: color.textSecondary }]}
                  numberOfLines={1}
                >
                  {label}
                </ThemedText>
              ) : null}
            </View>
            <ThemedText style={{ color: color.textSecondary, fontSize: 13 }}>
              {t("matching.details")}
            </ThemedText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={color.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          {/* full-screen: đóng modal — không bọc ScrollView trong Pressable (sẽ chặn cuộn) */}
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t("matching.closeA11y")}
          />
          <View style={[styles.modalCard, { backgroundColor: color.card }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {t("matching.modalTitle")}
            </ThemedText>
            <ThemedText style={[styles.modalSub, { color: color.textSecondary }]}>
              {t("matching.modalTotal")}{" "}
              <ThemedText type="defaultSemiBold" style={{ color: color.primary }}>
                {pct}%
              </ThemedText>
              {label ? ` · ${label}` : ""}
            </ThemedText>

            <ScrollView
              style={[styles.modalScroll, { maxHeight: breakdownScrollMaxHeight() }]}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              scrollEnabled
              keyboardShouldPersistTaps="handled"
              bounces
              contentContainerStyle={styles.modalScrollContent}
            >
              {breakdownList.length === 0 ? (
                <ThemedText style={{ color: color.textSecondary }}>
                  {t("matching.noBreakdown")}
                </ThemedText>
              ) : (
                breakdownList.map((c, idx) => {
                  const itemPct = criterionPercent(c.rawScore);
                  const imp = importanceDescription(c.weight, t);
                  const isAi = c.key === "ai_refinement";
                  return (
                    <View
                      key={`match-criterion-${idx}`}
                      style={[
                        styles.criteriaRow,
                        { borderBottomColor: color.border + "44" },
                      ]}
                    >
                      <View style={styles.criteriaHead}>
                        <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.criteriaTitle}>
                          {c.label || c.key || t("matching.criterionFallback")}
                        </ThemedText>
                        {itemPct != null ? (
                          <View
                            style={[
                              styles.scorePill,
                              { backgroundColor: color.primary + "18" },
                            ]}
                          >
                            <ThemedText
                              type="defaultSemiBold"
                              style={{ color: color.primary, fontSize: 15 }}
                            >
                              {itemPct}/100
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      {itemPct != null ? (
                        <View
                          style={[
                            styles.scoreBarTrack,
                            { backgroundColor: color.border + "55" },
                          ]}
                        >
                          <View
                            style={[
                              styles.scoreBarFill,
                              {
                                width: `${itemPct}%`,
                                backgroundColor: color.primary,
                              },
                            ]}
                          />
                        </View>
                      ) : null}
                      {isAi ? (
                        <ThemedText
                          style={[styles.criteriaMeta, { color: color.textSecondary }]}
                        >
                          {t("matching.aiNote")}
                        </ThemedText>
                      ) : imp ? (
                        <ThemedText
                          style={[styles.criteriaMeta, { color: color.textSecondary }]}
                        >
                          {t("matching.importance", { label: imp })}
                        </ThemedText>
                      ) : null}
                      {c.comment ? (
                        <ThemedText
                          style={[styles.comment, { color: color.textSecondary }]}
                        >
                          {c.comment}
                        </ThemedText>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>

            <Pressable
              onPress={() => setModalOpen(false)}
              style={[styles.closeBtn, { backgroundColor: color.primary + "22" }]}
            >
              <ThemedText style={{ color: color.primary, fontWeight: "700" }}>
                {t("matching.close")}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    marginTop: -4,
    marginBottom: 4,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  scoreLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  percent: {
    fontSize: 26,
    fontWeight: "800",
  },
  labelBadge: {
    fontSize: 13,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  /** Lớp mờ phía sau — tách khỏi thẻ nội dung để ScrollView nhận gesture cuộn. */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    borderRadius: 16,
    padding: 18,
    maxHeight: "80%",
    width: "100%",
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalSub: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  modalScrollHint: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalScroll: {},
  modalScrollContent: {
    paddingBottom: 20,
  },
  criteriaRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  criteriaHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  criteriaTitle: {
    flex: 1,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreBarTrack: {
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  criteriaMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  comment: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  closeBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
