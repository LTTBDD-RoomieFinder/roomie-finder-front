import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { useAppTheme } from "@/hooks/use-app-theme";

type Props = {
  percent: number;
  highMatch?: number;
  /** Kích thước vòng (mặc định 76). */
  size?: number;
};

/** Vòng tròn tiến trình + glow nhẹ khi >= highMatch (mặc định 80%). */
export function MatchPercentRing({ percent, highMatch = 80, size: sizeProp }: Props) {
  const { color } = useAppTheme();
  const SIZE = sizeProp ?? 76;
  const STROKE = Math.max(4, Math.round(SIZE * 0.08));
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;

  const p = Math.min(100, Math.max(0, percent));
  const offset = C * (1 - p / 100);
  const isHot = p >= highMatch;
  const stroke = isHot ? "#10B981" : "#4F46E5";

  const label = useMemo(() => Math.round(p), [p]);

  return (
    <View style={[styles.wrap, { width: SIZE, height: SIZE }]}>
      {isHot ? (
        <View
          style={[
            styles.glow,
            {
              width: SIZE + 6,
              height: SIZE + 6,
              borderRadius: (SIZE + 6) / 2,
              backgroundColor: "rgba(16, 185, 129, 0.22)",
              shadowColor: "#10B981",
            },
          ]}
        />
      ) : null}
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
        <G>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={stroke}
            strokeWidth={STROKE}
            strokeDasharray={`${C}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={styles.labelOverlay} pointerEvents="none">
        <Text style={[styles.labelPct, { color: color.text }]}>{label}</Text>
        <Text style={[styles.labelMatch, { color: color.textSecondary }]}>Match</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  },
  labelOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  labelPct: {
    fontSize: 16,
    fontWeight: "800",
  },
  labelMatch: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 0,
  },
});
