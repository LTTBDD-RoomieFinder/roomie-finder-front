import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { VerificationStatus } from "@/types/enums";

type Props = {
  status: VerificationStatus | null | undefined;
  /** Compact mode — smaller padding, no icon prefix. Defaults to false. */
  compact?: boolean;
};

const STATUS_ICON: Record<VerificationStatus, string> = {
  [VerificationStatus.VERIFIED]: "✓",
  [VerificationStatus.PENDING]:  "⏳",
  [VerificationStatus.REJECTED]: "✕",
  [VerificationStatus.EXPIRED]:  "⚠",
};

export function VerificationStatusChip({ status, compact = false }: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();

  if (!status) return null;

  const chipColor = resolveChipColor(status, color);
  const icon = STATUS_ICON[status];
  const label = t(`verification.status.${status}`);

  return (
    <View
      style={[
        styles.chip,
        compact && styles.chipCompact,
        { backgroundColor: chipColor.bg, borderColor: chipColor.border },
      ]}
    >
      {!compact && (
        <ThemedText style={[styles.icon, { color: chipColor.text }]}>
          {icon}
        </ThemedText>
      )}
      <ThemedText
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: chipColor.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </View>
  );
}

function resolveChipColor(
  status: VerificationStatus,
  color: { primary: string; error: string; backgroundSecondary: string; textSecondary: string; border: string }
) {
  switch (status) {
    case VerificationStatus.VERIFIED:
      return { bg: "#e6faf3", border: "#6fcf97", text: "#1a7a4a" };
    case VerificationStatus.PENDING:
      return { bg: "#fff8e1", border: "#f9c940", text: "#a07800" };
    case VerificationStatus.REJECTED:
      return { bg: "#fdecea", border: "#e57373", text: "#c62828" };
    case VerificationStatus.EXPIRED:
      return { bg: color.backgroundSecondary, border: color.border, text: color.textSecondary };
  }
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  chipCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  icon: {
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelCompact: {
    fontSize: 11,
  },
});
