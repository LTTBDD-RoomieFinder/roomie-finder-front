import React, { useEffect, useState } from "react";
import { Circle } from "react-native-maps";

type LatLng = { latitude: number; longitude: number };

type Props = {
  center: LatLng | null;
  active: boolean;
  /** Màu chủ đạo (hex, ví dụ #6366F1) */
  primaryHex: string;
};

/** Vòng gợi ý bán kính quét (mét) — sóng dồn nhẹ. */
const RADII_METERS = [95, 175, 260];

/**
 * Vòng tròn đồng tâm trên bản đồ khi bật chế độ quét gần.
 * Sóng đổi độ sáng theo bước thời gian (hiệu năng ổn định, không 60fps setState).
 */
export function MapRadarCircles({ center, active, primaryHex }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active || !center) {
      setPhase(0);
      return;
    }
    const id = setInterval(() => {
      setPhase((k) => (k + 1) % 3);
    }, 700);
    return () => clearInterval(id);
  }, [active, center?.latitude, center?.longitude]);

  if (!active || !center) return null;

  return (
    <>
      {RADII_METERS.map((r, i) => {
        const isPulse = phase % 3 === i;
        const strokeA = isPulse ? 0.5 : 0.18;
        const fillA = isPulse ? 0.1 : 0.04;
        return (
          <Circle
            key={r}
            center={center}
            radius={r}
            strokeWidth={isPulse ? 2.5 : 1.5}
            strokeColor={hexToRgba(primaryHex, strokeA)}
            fillColor={hexToRgba(primaryHex, fillA)}
          />
        );
      })}
    </>
  );
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return `rgba(99, 102, 241, ${a})`;
}
