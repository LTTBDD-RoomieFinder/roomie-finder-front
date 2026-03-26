import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  saving?: boolean;
  onSave: () => void;
  onStay: () => void;
  onDiscard: () => void;
};

export default function DirtyLeaveModal({
  visible,
  saving = false,
  onSave,
  onStay,
  onDiscard,
}: Props) {
  const { color } = useAppTheme() || {};
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    container: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: color.backgroundSecondary ?? "#fff",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: color.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
      color: color.text,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 20,
      color: color.textSecondary,
    },
    btnRow: {
      gap: 10,
    },
    btn: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    btnPrimary: {
      backgroundColor: color.primary,
    },
    btnNeutral: {
      backgroundColor: color.background,
      borderWidth: 1,
      borderColor: color.border,
    },
    btnDanger: {
      backgroundColor: color.background,
      borderWidth: 1,
      borderColor: color.error ?? "#dc2626",
    },
    textPrimary: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    textNeutral: {
      color: color.text,
      fontWeight: "600",
      fontSize: 16,
    },
    textDanger: {
      color: color.error ?? "#dc2626",
      fontWeight: "600",
      fontSize: 16,
    },
  });

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t("dirtyLeave.title")}</Text>
          <Text style={styles.message}>{t("dirtyLeave.message")}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textPrimary}>{t("dirtyLeave.save")}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnNeutral]}
              onPress={onStay}
              disabled={saving}
            >
              <Text style={styles.textNeutral}>{t("dirtyLeave.stay")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={onDiscard}
              disabled={saving}
            >
              <Text style={styles.textDanger}>{t("dirtyLeave.discard")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
