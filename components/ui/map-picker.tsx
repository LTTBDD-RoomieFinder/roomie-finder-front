import React from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Props as NativeMapPickerProps } from "./map-picker.native";

type Props = NativeMapPickerProps;

const DEFAULT_LAT = 21.0285;
const DEFAULT_LNG = 105.8542;

function MapPickerWebInput({
  latitude,
  longitude,
  onLocationSelect,
}: Props) {
  const [latText, setLatText] = React.useState(
    typeof latitude === "number" ? String(latitude) : String(DEFAULT_LAT),
  );
  const [lngText, setLngText] = React.useState(
    typeof longitude === "number" ? String(longitude) : String(DEFAULT_LNG),
  );

  React.useEffect(() => {
    setLatText(typeof latitude === "number" ? String(latitude) : String(DEFAULT_LAT));
    setLngText(typeof longitude === "number" ? String(longitude) : String(DEFAULT_LNG));
  }, [latitude, longitude]);

  const apply = () => {
    const lat = Number(latText);
    const lng = Number(lngText);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    onLocationSelect(lat, lng);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Map (Web)</Text>
      </View>

      <Text style={styles.desc}>
        Web tạm dùng nhập tay `latitude`/`longitude` để tránh lỗi SSR/native-only map.
      </Text>

      <View style={styles.inputsRow}>
        <View style={styles.inputBlock}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            value={latText}
            onChangeText={setLatText}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            value={lngText}
            onChangeText={setLngText}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>
      </View>

      <Pressable onPress={apply} style={styles.applyBtn}>
        <Text style={styles.applyBtnText}>Chọn vị trí</Text>
      </Pressable>
    </View>
  );
}

export default function MapPicker(props: Props) {
  if (Platform.OS === "web") {
    return <MapPickerWebInput {...props} />;
  }

  // Use eval('require') to avoid Metro/web statically analyzing and pulling native-only modules on web.
  // On native, this resolves to `map-picker.native.tsx`.
  let NativeComp: React.ComponentType<Props> | null = null;
  try {
    const req = eval("require");
    NativeComp = req("./map-picker.native").default;
  } catch {
    NativeComp = null;
  }

  if (!NativeComp) {
    // Fallback to input if native module fails to resolve.
    return <MapPickerWebInput {...props} />;
  }

  return <NativeComp {...props} />;
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
    color: "#6b7280",
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputBlock: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  applyBtn: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

