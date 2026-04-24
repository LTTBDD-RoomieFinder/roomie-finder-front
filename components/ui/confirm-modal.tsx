import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}: Props) {
  const { color, palette } = useAppTheme();
  const { t } = useLanguage();
  const resolvedTitle = title ?? t("confirm.title");
  const resolvedMessage = message ?? t("confirm.message");
  const resolvedConfirm = confirmText ?? t("confirm.confirm");
  const resolvedCancel = cancelText ?? t("confirm.cancel");

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    container: {
      width: "80%",
      maxWidth: 400,
      backgroundColor: palette.background,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: palette.text,
    },
    message: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
    },
    cancelBtn: {
      padding: 10,
    },
    confirmBtn: {
      padding: 10,
      backgroundColor: color.primary,
      borderRadius: 8,
    },
    cancelText: {
      color: palette.text,
    },
    confirmText: {
      color: "#fff",
      fontWeight: "bold",
    },
  });

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{resolvedTitle}</Text>
          <Text style={styles.message}>{resolvedMessage}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{resolvedCancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{resolvedConfirm}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

