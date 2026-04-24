import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useCreateRequest } from "@/hooks/use-create-request";
import type { UserResponse } from "@/types/request";

type SendRequestModalProps = {
  visible: boolean;
  receiver: UserResponse;
  onClose: () => void;
  onSuccess?: () => void;
};

export function SendRequestModal({
  visible,
  receiver,
  onClose,
  onSuccess,
}: SendRequestModalProps) {
  const [message, setMessage] = useState("");
  const { create, isLoading, error, resetError } = useCreateRequest();

  const { color } = useAppTheme();
  const { t } = useLanguage();
  const displayName = receiver?.fullName || receiver?.username || t("request.card.fallbackName");

  const handleClose = () => {
    setMessage("");
    resetError();
    onClose();
  };

  const handleSend = async () => {
    const result = await create({
      receiverId: Number(receiver.id),
      message: message.trim() || undefined,
    });
    if (result) {
      handleClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <ThemedView style={[styles.inner, { backgroundColor: color.background }]}>
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: color.primary + "18" }]}>
                <IconSymbol name="envelope.fill" size={22} color={color.primary} />
              </View>
              <View style={styles.modalTitleWrap}>
                <ThemedText style={[styles.title, { color: color.text }]}>
                  Gửi lời mời kết bạn phòng
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: color.text, opacity: 0.7 }]}>
                  đến <ThemedText style={[styles.subtitleName, { color: color.primary }]}>{displayName}</ThemedText>
                </ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.desc, { color: color.text, opacity: 0.65 }]}>
              {t("request.modal.description", { name: displayName })}
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  color: color.text,
                  borderColor: error ? color.error : color.border,
                  backgroundColor: color.background,
                },
              ]}
              placeholder={t("request.modal.placeholder")}
              placeholderTextColor={color.placeholder}
              value={message}
              onChangeText={(t) => { setMessage(t); if (error) resetError(); }}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />

            {error ? (
              <View style={[styles.errorBlock, { backgroundColor: color.error + "15" }]}>
                <IconSymbol name="exclamationmark.circle.fill" size={15} color={color.error} />
                <ThemedText style={[styles.error, { color: color.error, flex: 1 }]}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.cancelButton, { borderColor: color.border }]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <ThemedText style={[styles.cancelLabel, { color: color.text }]}>
                  {t("request.modal.cancel")}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.submitButton, { backgroundColor: isLoading ? color.primary + "80" : color.primary }]}
                onPress={handleSend}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={color.primaryText} size="small" />
                ) : (
                  <ThemedText style={[styles.submitLabel, { color: color.primaryText }]}>
                    {t("request.modal.send")}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },
  inner: {
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalTitleWrap: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  subtitleName: {
    fontWeight: "700",
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  errorBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
