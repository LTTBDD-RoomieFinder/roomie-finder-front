import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { TrustScoreBadge } from "@/components/reputation/trust-score-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { trustService } from "@/services/trust-service";
import type { TrustScoreResponse } from "@/types/reputation";

type Props = {
  /** Increment this to trigger a re-fetch (e.g. after saving profile). */
  refreshKey?: number;
};

export function TrustScoreSection({ refreshKey = 0 }: Props) {
  const { color, scheme, radius } = useAppTheme();
  const { t } = useLanguage();

  const [trust, setTrust] = useState<TrustScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalcBusy, setRecalcBusy] = useState(false);

  const isDark = scheme === "dark";
  const onPrimary = isDark ? "#151718" : "#fff";
  const primaryLight = isDark ? "#1f3333" : "#e6faf9";

  const fetchTrust = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trustService.getMine();
      setTrust(data);
    } catch (e) {
      setTrust(null);
      setError(typeof e === "string" ? e : t("trust.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchTrust();
  }, [fetchTrust, refreshKey]);

  const handleRecalculate = useCallback(async () => {
    setRecalcBusy(true);
    try {
      const data = await trustService.recalculate();
      setTrust(data);
      setError(null);
      Alert.alert(t("common.success"), t("trust.recalculateSuccess"));
    } catch (e) {
      Alert.alert(
        t("common.error"),
        typeof e === "string" ? e : t("trust.loadError")
      );
    } finally {
      setRecalcBusy(false);
    }
  }, [t]);

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
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={[styles.iconWrap, { backgroundColor: primaryLight }]}>
          <IconSymbol name="checkmark.seal.fill" size={18} color={color.primary} />
        </View>
        <ThemedText style={[styles.sectionTitle, { color: color.primary }]}>
          {t("trust.sectionTitle")}
        </ThemedText>
      </View>

      {/* Body */}
      {loading ? (
        <ActivityIndicator color={color.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorRow}>
          <ThemedText style={[styles.errorText, { color: color.error }]}>
            {error}
          </ThemedText>
          <TouchableOpacity onPress={fetchTrust} activeOpacity={0.7}>
            <ThemedText style={[styles.retryText, { color: color.primary }]}>
              {t("common.retry")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : trust ? (
        <>
          <TrustScoreBadge trust={trust} compact={false} />

          <TouchableOpacity
            style={[
              styles.recalcBtn,
              {
                backgroundColor: color.primary,
                opacity: recalcBusy ? 0.7 : 1,
                borderRadius: radius.lg,
              },
            ]}
            onPress={handleRecalculate}
            disabled={recalcBusy}
            activeOpacity={0.8}
          >
            {recalcBusy ? (
              <ActivityIndicator color={onPrimary} size="small" />
            ) : (
              <ThemedText style={[styles.recalcText, { color: onPrimary }]}>
                {t("trust.recalculate")}
              </ThemedText>
            )}
          </TouchableOpacity>
        </>
      ) : null}
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
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loader: {
    paddingVertical: 12,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  recalcBtn: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  recalcText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
