import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import type { TrustScoreResponse } from "@/types/reputation";

type Props = {
  trust: TrustScoreResponse | null | undefined;
  /** Show the numeric score alongside the label. Defaults to true. */
  showScore?: boolean;
  /** Compact mode — no breakdown rows, just score + label. Defaults to false. */
  compact?: boolean;
};

/** Maps score → background tint so the badge changes colour at each tier. */
function resolveTierColor(score: number): { bg: string; border: string; text: string } {
  if (score >= 80) return { bg: "#e8f5e9", border: "#66bb6a", text: "#2e7d32" };
  if (score >= 60) return { bg: "#e3f2fd", border: "#42a5f5", text: "#1565c0" };
  if (score >= 40) return { bg: "#fff8e1", border: "#ffca28", text: "#a07800" };
  return { bg: "#fce4ec", border: "#ef9a9a", text: "#c62828" };
}

export function TrustScoreBadge({ trust, showScore = true, compact = false }: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();

  if (!trust) return null;

  const score = Math.round(trust.totalScore ?? 0);
  const tier = resolveTierColor(score);

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: tier.bg, borderColor: tier.border }]}>
        {showScore && (
          <ThemedText style={[styles.compactScore, { color: tier.text }]}>
            {score}
          </ThemedText>
        )}
        <ThemedText style={[styles.compactLabel, { color: tier.text }]} numberOfLines={1}>
          {trust.label}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: color.backgroundSecondary, borderColor: color.border }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: color.text }]}>
          {t("trust.sectionTitle")}
        </ThemedText>
        <View style={[styles.pill, { backgroundColor: tier.bg, borderColor: tier.border }]}>
          {showScore && (
            <ThemedText style={[styles.pillScore, { color: tier.text }]}>
              {score}
            </ThemedText>
          )}
          <ThemedText style={[styles.pillLabel, { color: tier.text }]} numberOfLines={1}>
            {trust.label}
          </ThemedText>
        </View>
      </View>

      {/* Breakdown rows */}
      <View style={styles.breakdown}>
        <BreakdownRow
          label={t("trust.breakdown.verification")}
          value={trust.verificationBonus}
          max={30}
          color={color}
        />
        <BreakdownRow
          label={t("trust.breakdown.profile")}
          value={trust.profileCompletenessScore}
          max={20}
          color={color}
        />
        <BreakdownRow
          label={t("trust.breakdown.responseRate")}
          value={trust.responseRateScore}
          max={20}
          color={color}
        />
        <BreakdownRow
          label={t("trust.breakdown.reviews")}
          value={trust.reviewScore}
          max={20}
          color={color}
        />
        {trust.reportPenalty < 0 && (
          <BreakdownRow
            label={t("trust.breakdown.reportPenalty")}
            value={trust.reportPenalty}
            max={0}
            color={color}
            isNegative
          />
        )}
      </View>
    </View>
  );
}

type RowProps = {
  label: string;
  value: number;
  max: number;
  color: { text: string; textSecondary: string; primary: string; border: string };
  isNegative?: boolean;
};

function BreakdownRow({ label, value, max, color, isNegative = false }: RowProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColor = isNegative ? "#ef5350" : color.primary;

  return (
    <View style={styles.row}>
      <ThemedText style={[styles.rowLabel, { color: color.textSecondary }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <View style={[styles.barTrack, { backgroundColor: color.border + "55" }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <ThemedText style={[styles.rowValue, { color: color.text }]}>
        {isNegative ? value : `+${value}`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Compact */
  compact: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  compactScore: {
    fontSize: 13,
    fontWeight: "800",
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  /* Full card */
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  pillScore: {
    fontSize: 15,
    fontWeight: "800",
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  breakdown: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    fontSize: 12,
    width: 110,
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: "600",
    width: 36,
    textAlign: "right",
  },
});
