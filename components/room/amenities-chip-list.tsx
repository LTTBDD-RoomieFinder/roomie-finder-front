import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Amenity } from "@/types/Amenity";

type AmenitiesChipListProps = {
  amenities: Amenity[]; // list amenity
  selectable?: boolean; // true khi muốn chọn amenity
  selectedAmenities?: number[]; // list amenity đã chọn
  onToggleAmenity?: (amenityId: number) => void; // function xử lý khi click vào amenity
};

export function AmenitiesChipList({
  amenities,
  selectable = false,
  selectedAmenities = [],
  onToggleAmenity,
}: AmenitiesChipListProps) {
  const { color } = useAppTheme();

  return (
    <View style={styles.wrap}>
      {amenities.map((amenity) => {
        const selected = selectedAmenities.includes(amenity.id);

        return (
          <Pressable
            key={amenity.id}
            disabled={!selectable}
            onPress={() => onToggleAmenity?.(amenity.id)}
            style={[
              styles.chip,
              {
                borderColor: selected ? color.primary : color.border,
                backgroundColor: color.background,
              },
            ]}
          >
            <ThemedText
              style={{ color: selected ? color.primary : color.text }}
              type="defaultSemiBold"
            >
              {amenity.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
