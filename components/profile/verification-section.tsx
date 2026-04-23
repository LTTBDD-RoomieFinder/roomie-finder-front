import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/themed-text";
import { VerificationStatusChip } from "@/components/reputation/verification-status-chip";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { imageService } from "@/services/image-service";
import { verificationService } from "@/services/verification-service";
import { VerificationStatus } from "@/types/enums";
import type { VerificationResponse } from "@/types/reputation";

type Props = {
  /** Called after a successful submit so parent can refresh trust score. */
  onVerificationSubmitted?: () => void;
};

const HINT_KEY: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]:  "verification.pendingHint",
  [VerificationStatus.VERIFIED]: "verification.verifiedHint",
  [VerificationStatus.REJECTED]: "verification.rejectedHint",
  [VerificationStatus.EXPIRED]:  "verification.expiredHint",
};

/** True when status allows re-submission. */
function canSubmit(status: VerificationStatus | null): boolean {
  return (
    status === null ||
    status === VerificationStatus.REJECTED ||
    status === VerificationStatus.EXPIRED
  );
}

type ImageField = "front" | "back" | "selfie";

type PickedImages = Record<ImageField, string>;

const EMPTY_IMAGES: PickedImages = { front: "", back: "", selfie: "" };

export function VerificationSection({ onVerificationSubmitted }: Props) {
  const { color, scheme, radius } = useAppTheme();
  const { t } = useLanguage();

  const [verification, setVerification] = useState<VerificationResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [docNumberError, setDocNumberError] = useState("");
  const [images, setImages] = useState<PickedImages>(EMPTY_IMAGES);
  const [imageErrors, setImageErrors] = useState<Partial<Record<ImageField, string>>>({});

  const isDark = scheme === "dark";
  const onPrimary = isDark ? "#151718" : "#fff";
  const primaryLight = isDark ? "#1f3333" : "#e6faf9";
  const primaryBorder = isDark ? "#2e5c58" : "#99ddd9";

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const data = await verificationService.getMyStatus();
      setVerification(data);
      // Auto-open form when re-submission needed
      if (canSubmit(data.status)) setFormOpen(true);
    } catch {
      // 7001 = no document yet → open form
      setVerification(null);
      setFormOpen(true);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const pickImage = useCallback(async (field: ImageField) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("common.permissionTitle"), t("common.mediaLibraryPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImages((prev) => ({ ...prev, [field]: result.assets[0].uri }));
      setImageErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [t]);

  const validate = (): boolean => {
    let valid = true;
    if (!documentNumber.trim()) {
      setDocNumberError(t("verification.errors.7004"));
      valid = false;
    } else {
      setDocNumberError("");
    }
    const errs: Partial<Record<ImageField, string>> = {};
    if (!images.front) { errs.front = t("verification.errors.7005"); valid = false; }
    if (!images.selfie) { errs.selfie = t("verification.errors.7006"); valid = false; }
    setImageErrors(errs);
    return valid;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const [frontUrl, selfieUrl] = await Promise.all([
        imageService.uploadToCloudinary(images.front),
        imageService.uploadToCloudinary(images.selfie),
      ]);
      const backUrl = images.back
        ? await imageService.uploadToCloudinary(images.back)
        : undefined;
      const res = await verificationService.submit({
        documentNumber: documentNumber.trim(),
        documentImageUrl: frontUrl,
        documentBackImageUrl: backUrl || undefined,
        selfieImageUrl: selfieUrl,
      });
      setVerification(res);
      setFormOpen(false);
      setDocumentNumber("");
      setImages(EMPTY_IMAGES);
      Alert.alert(t("common.success"), t("verification.submitSuccess"));
      onVerificationSubmitted?.();
    } catch (e) {
      const msg = typeof e === "string" ? e : t("common.error");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentNumber, images, onVerificationSubmitted, t]);

  const status = verification?.status ?? null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color.backgroundSecondary,
          borderColor: color.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={[styles.iconWrap, { backgroundColor: primaryLight }]}>
          <IconSymbol name="checkmark.circle.fill" size={18} color={color.primary} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={[styles.sectionTitle, { color: color.primary }]}>
            {t("verification.sectionTitle")}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: color.textSecondary }]}>
            {t("verification.sectionSubtitle")}
          </ThemedText>
        </View>
      </View>

      {/* Loading */}
      {loadingStatus ? (
        <ActivityIndicator color={color.primary} style={styles.loader} />
      ) : (
        <>
          {/* Status row */}
          {status !== null && (
            <View style={styles.statusRow}>
              <VerificationStatusChip status={status} />
              {status === VerificationStatus.VERIFIED && verification?.verifiedAt && (
                <ThemedText style={[styles.metaText, { color: color.textSecondary }]}>
                  {new Date(verification.verifiedAt).toLocaleDateString()}
                </ThemedText>
              )}
            </View>
          )}

          {/* Hint text */}
          {status !== null && (
            <View
              style={[
                styles.hintBox,
                { backgroundColor: primaryLight, borderColor: primaryBorder },
              ]}
            >
              <ThemedText style={[styles.hintText, { color: color.textSecondary }]}>
                {t(HINT_KEY[status])}
              </ThemedText>
              {status === VerificationStatus.REJECTED && verification?.reviewNote && (
                <ThemedText style={[styles.reviewNote, { color: color.error }]}>
                  {t("verification.reviewNote")}: {verification.reviewNote}
                </ThemedText>
              )}
            </View>
          )}

          {/* Toggle form button (only when actionable) */}
          {canSubmit(status) && (
            <Pressable
              onPress={() => setFormOpen((v) => !v)}
              style={({ pressed }) => [
                styles.toggleFormBtn,
                {
                  backgroundColor: pressed
                    ? color.backgroundSecondary
                    : color.background,
                  borderColor: color.border,
                  borderRadius: 10,
                },
              ]}
            >
              <ThemedText style={[styles.toggleFormText, { color: color.primary }]}>
                {formOpen ? "▲ " : "▼ "}
                {t("verification.submitTitle")}
              </ThemedText>
            </Pressable>
          )}

          {/* Form */}
          {formOpen && canSubmit(status) && (
            <View style={styles.form}>
              {/* Document number */}
              <ThemedText style={[styles.label, { color: color.textSecondary }]}>
                {t("verification.documentNumber")}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: color.text,
                    backgroundColor: color.background,
                    borderColor: docNumberError ? color.error : color.border,
                  },
                ]}
                placeholder={t("verification.documentNumberPh")}
                placeholderTextColor={color.placeholder}
                value={documentNumber}
                onChangeText={(v) => {
                  setDocumentNumber(v);
                  if (v.trim()) setDocNumberError("");
                }}
                keyboardType="numeric"
                maxLength={12}
              />
              {!!docNumberError && (
                <ThemedText style={[styles.errorText, { color: color.error }]}>
                  {docNumberError}
                </ThemedText>
              )}

              {/* Image pickers */}
              <ImagePickerField
                label={t("verification.documentImageUrl")}
                uri={images.front}
                error={imageErrors.front}
                onPress={() => pickImage("front")}
                color={color}
                primaryLight={primaryLight}
              />
              <ImagePickerField
                label={`${t("verification.documentBackImageUrl")} (${t("common.optional")})`}
                uri={images.back}
                onPress={() => pickImage("back")}
                color={color}
                primaryLight={primaryLight}
              />
              <ImagePickerField
                label={t("verification.selfieImageUrl")}
                uri={images.selfie}
                error={imageErrors.selfie}
                onPress={() => pickImage("selfie")}
                color={color}
                primaryLight={primaryLight}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: color.primary,
                    opacity: submitting ? 0.7 : 1,
                    borderRadius: radius.lg,
                  },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color={onPrimary} size="small" />
                ) : (
                  <ThemedText style={[styles.submitText, { color: onPrimary }]}>
                    {t("verification.submit")}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ── Internal sub-component ────────────────────────────────────────────────────

type ImagePickerFieldProps = {
  label: string;
  uri: string;
  error?: string;
  onPress: () => void;
  color: {
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    primary: string;
    background: string;
  };
  primaryLight: string;
};

function ImagePickerField({
  label,
  uri,
  error,
  onPress,
  color,
  primaryLight,
}: ImagePickerFieldProps) {
  return (
    <View style={styles.imageField}>
      <ThemedText style={[styles.label, { color: color.textSecondary }]}>
        {label}
      </ThemedText>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.imagePicker,
          {
            backgroundColor: uri ? primaryLight : color.background,
            borderColor: error ? color.error : uri ? color.primary : color.border,
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.previewImg} resizeMode="cover" />
        ) : (
          <View style={styles.imagePickerPlaceholder}>
            <ThemedText style={[styles.imagePickerIcon, { color: color.primary }]}>
              📷
            </ThemedText>
            <ThemedText style={[styles.imagePickerHint, { color: color.textSecondary }]}>
              Chọn ảnh
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
      {!!error && (
        <ThemedText style={[styles.errorText, { color: color.error }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
  },
  loader: {
    paddingVertical: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
  },
  hintBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewNote: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  toggleFormBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  toggleFormText: {
    fontWeight: "600",
    fontSize: 14,
  },
  form: {
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },
  imageField: {
    gap: 0,
  },
  imagePicker: {
    borderWidth: 1,
    borderRadius: 12,
    height: 100,
    overflow: "hidden",
    marginBottom: 4,
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePickerIcon: {
    fontSize: 28,
  },
  imagePickerHint: {
    fontSize: 13,
  },
  previewImg: {
    width: "100%",
    height: "100%",
  },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  submitText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
