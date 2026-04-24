import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const { width: W } = Dimensions.get("window");

type Props = {
  /** Chỉ hiện cùng chế độ quét. */
  visible: boolean;
  colorRgb: { r: number; g: number; b: number };
};

/**
 * Lớp phủ ở cạnh dưới bản đồ: hình quạt gradient xoay chậm (radar) — thuần trang trí.
 */
export function MapScanSweepOverlay({ visible, colorRgb }: Props) {
  const rot = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(rot);
      rot.value = 0;
      return;
    }
    rot.value = 0;
    rot.value = withRepeat(
      withTiming(360, { duration: 4500, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rot, visible]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  if (!visible) return null;

  const c1 = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.02)`;
  const c2 = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.14)`;
  const c3 = `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0.28)`;

  return (
    <View style={styles.root} pointerEvents="none" accessibilityElementsHidden>
      <Animated.View style={[styles.spinner, aStyle]}>
        <LinearGradient
          colors={[c1, c2, c3, c1]}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.wedge}
        />
      </Animated.View>
    </View>
  );
}

const SIZE = Math.min(W * 0.92, 420);

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 0,
  },
  spinner: {
    width: SIZE,
    height: SIZE,
    marginBottom: -SIZE * 0.45,
  },
  wedge: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: SIZE / 2,
    borderTopRightRadius: SIZE / 2,
  },
});
