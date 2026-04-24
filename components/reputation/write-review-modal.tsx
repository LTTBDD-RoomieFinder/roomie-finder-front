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
import { invalidatePosterReviewSummaryCache } from "@/hooks/use-poster-review-summary";
import { useLanguage } from "@/hooks/use-language";
import { reviewService } from "@/services/review-service";
import { ReviewContext } from "@/types/enums";

const MAX_COMMENT = 2000;

type Props = {
  visible: boolean;
  onClose: () => void;
  revieweeId: number;
  revieweeName: string;
  onSuccess: () => void;
};

export function WriteReviewModal({
  visible,
  onClose,
  revieweeId,
  revieweeName,
  onSuccess,
}: Props) {
  const { color, radius } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(5);
  const [context, setContext] = useState<ReviewContext>(
    ReviewContext.LANDLORD_EXPERIENCE,
  );
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(5);
      setContext(ReviewContext.LANDLORD_EXPERIENCE);
      setComment("");
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !Number.isFinite(revieweeId) || revieweeId <= 0) return;
    const trimmed = comment.trim().slice(0, MAX_COMMENT);
    try {
      setSubmitting(true);
      await reviewService.create({
        revieweeId,
        rating,
        comment: trimmed.length > 0 ? trimmed : undefined,
        context,
      });
      invalidatePosterReviewSummaryCache(revieweeId);
      Alert.alert(t("common.success"), t("publicUser.writeReview.success"));
      onSuccess();
      onClose();
    } catch (e) {
      const msg =
        typeof e === "string" && e.trim()
          ? e
          : t("publicUser.writeReview.failed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    comment,
    context,
    onClose,
    onSuccess,
    rating,
    revieweeId,
    submitting,
    t,
  ]);

  const contexts: { value: ReviewContext; labelKey: string }[] = [
    {
      value: ReviewContext.LANDLORD_EXPERIENCE,
      labelKey: "publicUser.writeReview.contextLandlord",
    },
    {
      value: ReviewContext.ROOMMATE_EXPERIENCE,
      labelKey: "publicUser.writeReview.contextRoommate",
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: color.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: color.border + "80",
              paddingTop: Platform.OS === "android" ? Math.max(insets.top, 8) : 8,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={styles.headerBtn}
            hitSlop={12}
            disabled={submitting}
          >
            <ThemedText style={{ color: color.primary, fontWeight: "700", fontSize: 16 }}>
              {t("publicUser.writeReview.cancel")}
            </ThemedText>
          </Pressable>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.headerTitle, { color: color.text }]}
            numberOfLines={1}
          >
            {t("publicUser.writeReview.title")}
          </ThemedText>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={[styles.subtitle, { color: color.textSecondary }]}>
            {t("publicUser.writeReview.subtitle", {
              name: revieweeName.trim() || t("common.user"),
            })}
          </ThemedText>
          <View
            style={[
              styles.whyBox,
              { backgroundColor: color.primary + "0C", borderColor: color.primary + "28", borderRadius: radius.lg },
            ]}
          >
            <Ionicons name="sparkles" size={18} color={color.primary} style={styles.whyIcon} />
            <ThemedText style={[styles.whyText, { color: color.textSecondary }]}>
              {t("publicUser.writeReview.valueProposition")}
            </ThemedText>
          </View>

          <ThemedText style={[styles.label, { color: color.text }]}>
            {t("publicUser.writeReview.ratingLabel")}
          </ThemedText>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setRating(n)}
                hitSlop={6}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={`${n} ${t("publicUser.writeReview.stars")}`}
              >
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={36}
                  color={n <= rating ? "#F5A623" : color.border}
                />
              </Pressable>
            ))}
          </View>

          <ThemedText style={[styles.label, { color: color.text, marginTop: 20 }]}>
            {t("publicUser.writeReview.contextLabel")}
          </ThemedText>
          <View style={styles.contextRow}>
            {contexts.map(({ value, labelKey }) => {
              const selected = context === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setContext(value)}
                  disabled={submitting}
                  style={[
                    styles.contextChip,
                    {
                      borderRadius: radius.lg,
                      borderColor: selected ? color.primary : color.border,
                      backgroundColor: selected ? color.primary + "18" : color.card,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: selected ? color.primary : color.text,
                      textAlign: "center",
                    }}
                  >
                    {t(labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.label, { color: color.text, marginTop: 20 }]}>
            {t("publicUser.writeReview.commentLabel")}
          </ThemedText>
          <TextInput
            value={comment}
            onChangeText={(x) => setComment(x.slice(0, MAX_COMMENT))}
            placeholder={t("publicUser.writeReview.commentPlaceholder")}
            placeholderTextColor={color.textSecondary}
            multiline
            editable={!submitting}
            style={[
              styles.input,
              {
                color: color.text,
                borderColor: color.border,
                backgroundColor: color.backgroundSecondary,
                borderRadius: radius.lg,
              },
            ]}
          />
          <ThemedText style={[styles.hint, { color: color.textSecondary }]}>
            {t("publicUser.writeReview.commentHint", { max: MAX_COMMENT })}
          </ThemedText>

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={submitting}
            style={[
              styles.submitBtn,
              {
                backgroundColor: submitting ? color.placeholder : color.primary,
                borderRadius: radius.lg,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitText}>
                {t("publicUser.writeReview.submit")}
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { minWidth: 72, paddingHorizontal: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17 },
  body: { paddingHorizontal: 20, paddingTop: 18 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  whyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  whyIcon: { marginTop: 1 },
  whyText: { flex: 1, fontSize: 13, lineHeight: 19 },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 10 },
  starRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 4,
  },
  contextRow: { flexDirection: "row", gap: 10 },
  contextChip: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    textAlignVertical: "top",
  },
  hint: { fontSize: 12, marginTop: 8 },
  submitBtn: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
