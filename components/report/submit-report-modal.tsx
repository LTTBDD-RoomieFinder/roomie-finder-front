import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { reportService } from "@/services/report-service";
import { ReportCategory, ReportTargetType } from "@/types/enums";

const CATEGORIES: ReportCategory[] = [
  ReportCategory.SCAM,
  ReportCategory.FAKE_LISTING,
  ReportCategory.IDENTITY_FRAUD,
  ReportCategory.HARASSMENT,
  ReportCategory.SPAM,
  ReportCategory.INAPPROPRIATE_CONTENT,
  ReportCategory.OTHER,
];

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
  /** Gợi ý ngắn (vd: tên người / tiêu đề bài). */
  contextLabel?: string;
  onSubmitted?: () => void;
};

function mapReportError(t: (k: string) => string, err: unknown): string {
  const msg = typeof err === "string" ? err : (err as Error)?.message ?? "";
  const codeMatch = msg.match(/\b(1000[0-9])\b/);
  if (codeMatch) {
    const key = `report.errors.${codeMatch[1]}`;
    const localized = t(key);
    if (localized !== key) return localized;
  }
  return msg.trim() || t("common.error");
}

export function SubmitReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  contextLabel,
  onSubmitted,
}: Props) {
  const { color, radius } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<ReportCategory>(ReportCategory.OTHER);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCategory(ReportCategory.OTHER);
      setDetails("");
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    const trimmed = details.trim();
    if (!trimmed) {
      Alert.alert(t("common.error"), t("report.errors.10006"));
      return;
    }
    if (!Number.isFinite(targetId) || targetId <= 0) {
      Alert.alert(t("common.error"), t("report.errors.10004"));
      return;
    }
    setSubmitting(true);
    try {
      await reportService.submit({
        targetType,
        targetId,
        category,
        details: trimmed,
      });
      Alert.alert(t("common.success"), t("report.submitSuccess"));
      onSubmitted?.();
      onClose();
    } catch (e) {
      Alert.alert(t("common.error"), mapReportError(t, e));
    } finally {
      setSubmitting(false);
    }
  }, [category, details, onClose, onSubmitted, t, targetId, targetType]);

  const targetLabel =
    targetType === ReportTargetType.USER
      ? t("report.targetType_USER")
      : t("report.targetType_POST");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.45)" }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: color.background,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              paddingBottom: insets.bottom + 16,
              maxHeight: "88%",
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: color.border }]} />
          <View style={[styles.head, { borderBottomColor: color.border }]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ color: color.text, fontSize: 17 }}>
                {t("report.modalTitle")}
              </ThemedText>
              <ThemedText style={{ color: color.textSecondary, fontSize: 12, marginTop: 4 }}>
                {targetLabel} · #{targetId}
                {contextLabel ? ` · ${contextLabel}` : ""}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={26} color={color.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={[styles.label, { color: color.textSecondary }]}>
              {t("report.category")}
            </ThemedText>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? color.primary + "22" : color.backgroundSecondary,
                        borderColor: active ? color.primary : color.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? color.primary : color.text,
                      }}
                      numberOfLines={2}
                    >
                      {t(`report.category_${c}`)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText style={[styles.label, { color: color.textSecondary, marginTop: 8 }]}>
              {t("report.details")}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: color.backgroundSecondary,
                  borderColor: color.border,
                  color: color.text,
                },
              ]}
              placeholder={t("report.detailsPh")}
              placeholderTextColor={color.placeholder}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={[
                styles.submit,
                { backgroundColor: color.primary, opacity: submitting ? 0.65 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitTxt}>{t("report.submit")}</ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Nút icon nhỏ (cờ) mở modal báo cáo — dùng trong header / hàng công cụ. */
export function ReportTriggerButton({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { color } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.trigger,
        {
          borderColor: color.border,
          backgroundColor: color.backgroundSecondary,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons name="flag-outline" size={18} color={color.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10 },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { padding: 4, marginTop: -4 },
  body: { padding: 18, gap: 10, paddingBottom: 28 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "100%",
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  submit: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  trigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
