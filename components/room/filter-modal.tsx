import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ThemedText } from "@/components/themed-text";
import { PostSearchRequest } from "@/data/request";
import { GenderRequirement, RoomType } from "@/types/enums";
import { GENDER_REQ_LABELS, ROOM_TYPE_LABELS } from "@/constants/room-constants";
import Divider from "@/components/ui/divider";
import Slider from "@react-native-community/slider";
import { AmenityService } from "@/services/amenity-service";
import MapPicker from "@/components/ui/map-picker";

interface Amenity {
  id: number;
  name: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Omit<PostSearchRequest, "keyword" | "cursor" | "size">) => void;
  initialFilters?: Omit<PostSearchRequest, "keyword" | "cursor" | "size">;
}

export function FilterModal({ visible, onClose, onApply, initialFilters = {} }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();

  const [filters, setFilters] = useState<Omit<PostSearchRequest, "keyword" | "cursor" | "size">>(initialFilters);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);

  useEffect(() => {
    if (visible && amenitiesList.length === 0) {
      AmenityService.getAllAmenities()
        .then((data: any) => {
          if (data) setAmenitiesList(data);
        })
        .catch((err) => console.error("Failed to load amenities:", err));
    }
  }, [visible, amenitiesList.length]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, visible]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const toggleRoomType = (type: RoomType) => {
    setFilters(prev => ({
      ...prev,
      roomType: prev.roomType === type ? undefined : type
    }));
  };

  const toggleGender = (gender: GenderRequirement) => {
    setFilters(prev => ({
      ...prev,
      genderRequirement: prev.genderRequirement === gender ? undefined : gender
    }));
  };

  const toggleAmenity = (id: number) => {
    setFilters(prev => {
      const current = prev.amenityIds || [];
      const isSelected = current.includes(id);
      return {
        ...prev,
        amenityIds: isSelected ? current.filter((x: number) => x !== id) : [...current, id]
      };
    });
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const maxPriceValue = useMemo(() => filters.maxPrice ?? 20000000, [filters.maxPrice]);
  const minPriceValue = useMemo(() => filters.minPrice ?? 0, [filters.minPrice]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={[styles.container, { backgroundColor: color.background }]}>
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: color.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={color.text} />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.title}>Bộ lọc nâng cao</ThemedText>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <ThemedText style={{ color: color.primary, fontWeight: '600' }}>Xóa</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* ROOM TYPE SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Loại phòng</ThemedText>
              <View style={styles.chipRow}>
                {Object.entries(ROOM_TYPE_LABELS).map(([key, label]) => {
                  const type = key as RoomType;
                  const isSelected = filters.roomType === type;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleRoomType(type)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? color.primary : color.card,
                          borderColor: isSelected ? color.primary : color.border,
                        }
                      ]}
                    >
                      <ThemedText style={{
                        color: isSelected ? color.primaryText : color.text,
                        fontWeight: isSelected ? '600' : '400'
                      }}>
                        {label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Divider />

            {/* GENDER SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Giới tính</ThemedText>
              <View style={styles.chipRow}>
                {Object.entries(GENDER_REQ_LABELS).map(([key, label]) => {
                  const gender = key as GenderRequirement;
                  const isSelected = filters.genderRequirement === gender;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleGender(gender)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? color.primary : color.card,
                          borderColor: isSelected ? color.primary : color.border,
                        }
                      ]}
                    >
                      <ThemedText style={{
                        color: isSelected ? color.primaryText : color.text,
                        fontWeight: isSelected ? '600' : '400'
                      }}>
                        {label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Divider />

            {/* PRICE SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Khoảng giá</ThemedText>

              <View style={styles.sectionHeader}>
                <ThemedText style={{ opacity: 0.7 }}>Tối thiểu</ThemedText>
                <ThemedText style={{ color: color.primary, fontWeight: "600" }}>
                  {formatPrice(minPriceValue)}
                </ThemedText>
              </View>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={20000000}
                step={500000}
                value={minPriceValue}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    minPrice: Math.min(val, prev.maxPrice ?? 20000000),
                  }))
                }
                minimumTrackTintColor={color.primary}
                maximumTrackTintColor={color.border}
                thumbTintColor={color.primary}
              />

              <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                <ThemedText style={{ opacity: 0.7 }}>Tối đa</ThemedText>
                <ThemedText style={{ color: color.primary, fontWeight: "600" }}>
                  {formatPrice(maxPriceValue)}
                </ThemedText>
              </View>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={20000000}
                step={500000}
                value={maxPriceValue}
                onValueChange={(val) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxPrice: Math.max(val, prev.minPrice ?? 0),
                  }))
                }
                minimumTrackTintColor={color.primary}
                maximumTrackTintColor={color.border}
                thumbTintColor={color.primary}
              />
            </View>

            <Divider />

            {/* LOCATION SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Khu vực tìm kiếm
              </ThemedText>


              <MapPicker
                latitude={filters.userLat}
                longitude={filters.userLng}
                onLocationSelect={(lat, lng) => {
                  setFilters((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    cityName: undefined,
                    districtName: undefined,
                    wardName: undefined,
                  }));
                }}
              />

              <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                <ThemedText style={{ opacity: 0.7 }}>Bán kính (km)</ThemedText>
                <ThemedText style={{ color: color.primary, fontWeight: "600" }}>
                  {(filters.radiusInKm ?? 50).toFixed(0)} km
                </ThemedText>
              </View>

              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={filters.radiusInKm ?? 50}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, radiusInKm: val }))}
                minimumTrackTintColor={color.primary}
                maximumTrackTintColor={color.border}
                thumbTintColor={color.primary}
              />
            </View>

            <Divider />

            {/* AREA SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Diện tích (m²)</ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.areaInput, { backgroundColor: color.card, color: color.text, borderColor: color.border }]}
                  placeholder="Tối thiểu"
                  placeholderTextColor={color.placeholder}
                  keyboardType="numeric"
                  value={filters.minArea?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, minArea: text ? Number(text) : undefined }))}
                />
                <View style={[styles.dash, { backgroundColor: color.border }]} />
                <TextInput
                  style={[styles.areaInput, { backgroundColor: color.card, color: color.text, borderColor: color.border }]}
                  placeholder="Tối đa"
                  placeholderTextColor={color.placeholder}
                  keyboardType="numeric"
                  value={filters.maxArea?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, maxArea: text ? Number(text) : undefined }))}
                />
              </View>
            </View>

            <Divider />

            {/* CAPACITY SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Sức chứa</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: color.card, color: color.text, borderColor: color.border }]}
                placeholder="Số người (capacity)"
                placeholderTextColor={color.placeholder}
                keyboardType="numeric"
                value={filters.capacity?.toString() || ""}
                onChangeText={(text) =>
                  setFilters((prev) => ({ ...prev, capacity: text ? Number(text) : undefined }))
                }
              />
            </View>

            <Divider />

            {/* AMENITIES SECTION */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Tiện ích</ThemedText>
              <View style={styles.chipRow}>
                {amenitiesList.map((amenity) => {
                  const isSelected = filters.amenityIds?.includes(amenity.id);
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      onPress={() => toggleAmenity(amenity.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? color.primary : color.card,
                          borderColor: isSelected ? color.primary : color.border,
                        }
                      ]}
                    >
                      <ThemedText style={{
                        color: isSelected ? color.primaryText : color.text,
                        fontWeight: isSelected ? '600' : '400',
                        fontSize: 13,
                      }}>
                        {amenity.name}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: color.border }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: color.primary }]}
              onPress={handleApply}
            >
              <ThemedText style={[styles.applyBtnText, { color: color.primaryText }]}>
                Áp dụng
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    flex: 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
  },
  clearBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  stackedInputs: {
    gap: 10,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  areaInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  applyBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
