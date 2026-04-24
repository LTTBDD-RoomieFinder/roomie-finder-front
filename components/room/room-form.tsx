import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { BlurView } from "expo-blur";

import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { genderReqLabelKey, roomTypeLabelKey } from "@/lib/i18n-labels";
import { ThemedText } from "../themed-text";
import { AmenitiesChipList } from "./amenities-chip-list";
import LocationPicker from "../ui/location-picker";
import ImageUploadSection from "../ui/image-upload-section";
import { locationService } from "@/services/location-service";
import FormSection from "../ui/form-section";
import { RoomCreateRequest } from "@/data/request";
import { RoomFormValues } from "@/types/Room";
import { imageService } from "@/services/image-service";
import { roomService } from "@/services/room-service";
import { useRouter } from "expo-router";
import { AmenityService } from "@/services/amenity-service";
import { GENDER_REQ_ORDER, ROOM_TYPE_ORDER } from "@/constants/room-constants";

type RoomFormProps = {
  initialValues: RoomFormValues;
  submitLabel: string;
  onSubmit: (data: RoomCreateRequest) => Promise<void>;
};

export function RoomForm({ initialValues, submitLabel, onSubmit }: RoomFormProps) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const [values, setValues] = useState<RoomFormValues>(initialValues);
  // State quản lý danh sách từ API
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [amenities, setAmenities] = useState([]);

  // State quản lý giá trị đang chọn
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);

  // State quản lý images sẽ được truyền xuống ImageUploadSection
  const [images, setImages] = useState<string[]>(initialValues.images || []);

  // loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldStyle = useMemo(
    () => [
      styles.input,
      {
        color: color.text,
        borderColor: color.border,
        backgroundColor: color.background,
      },
    ],
    [color.background, color.border, color.text]
  );

  const toggleAmenity = (amenityId: number) => {
    setValues((prev) => {
      const hasAmenity = prev.amenities.includes(amenityId);
      return {
        ...prev,
        amenities: hasAmenity
          ? prev.amenities.filter((item) => item !== amenityId)
          : [...prev.amenities, amenityId],
      };
    });
  };

  // 1. Fetch data khi mount
  useEffect(() => {
    const fetchCitiesAndMatch = async () => {
      const data = await locationService.getCities();
      setCities(data);

      if (initialValues.address.city && data) {
        const foundCity = data.find((c: any) => c.name === initialValues.address.city);
        if (foundCity) {
          setSelectedCityId(foundCity.id);
          const distData = await locationService.getDistricts(foundCity.id);
          setDistricts(distData);

          if (initialValues.address.district && distData) {
            const foundDist = distData.find((d: any) => d.name === initialValues.address.district);
            if (foundDist) {
              setSelectedDistrictId(foundDist.id);
              const wardData = await locationService.getWards(foundDist.id);
              setWards(wardData);

              if (initialValues.address.ward && wardData) {
                const foundWard = wardData.find((w: any) => w.name === initialValues.address.ward);
                if (foundWard) {
                  setSelectedWardId(foundWard.id);
                }
              }
            }
          }
        }
      }
    };

    const fetchAmenities = async () => {
      const data = await AmenityService.getAllAmenities();
      setAmenities(data);
    };
    fetchCitiesAndMatch();
    fetchAmenities();
  }, []);

  // 2. Khi City thay đổi -> Fetch Districts
  const handleCityChange = async (cityId: number) => {
    setSelectedCityId(cityId);
    setSelectedDistrictId(null); // Reset cấp con
    setSelectedWardId(null);
    const data = await locationService.getDistricts(cityId);
    setDistricts(data);
    setWards([]); // Clear wards khi city thay đổi
  };

  // 3. Khi District thay đổi -> Fetch Wards
  const handleDistrictChange = async (districtId: number) => {
    setSelectedDistrictId(districtId);
    setSelectedWardId(null); // Reset cấp con
    const data = await locationService.getWards(districtId);
    setWards(data);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Chặn bấm liên tục

    try {
      setIsSubmitting(true);
      // Upload tất cả ảnh và lấy về URL
      const uploadPromises = images.map((imgUri) =>
        imageService.uploadToCloudinary(imgUri)
      );
      // Chờ tất cả ảnh được upload và lấy về URL
      const uploadedImageUrls = await Promise.all(uploadPromises);

      const roomCreateData: RoomCreateRequest = {
        title: values.title,
        price: values.price,
        area: values.area,
        capacity: values.capacity,
        roomType: values.roomType,
        genderRequirement: values.genderRequirement,
        description: values.description,
        address: {
          cityId: selectedCityId!,
          districtId: selectedDistrictId!,
          wardId: selectedWardId!,
          streetAddress: values.address.streetAddress,
        },
        imageUrls: uploadedImageUrls,
        amenityIds: values.amenities,
      };

      await onSubmit(roomCreateData);
    } catch (error: Error | any) {
      console.error("Error creating room:", error);
      alert(error?.message || t("room.form.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChip = (label: string, isSelected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? color.primary : color.background,
          borderColor: isSelected ? color.primary : color.border,
        },
      ]}
    >
      <ThemedText
        style={{
          color: isSelected ? color.primaryText : color.text,
          fontSize: 14,
          fontWeight: isSelected ? "600" : "400",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <FormSection title={t("room.form.basicSection")}>
        <Field label={t("room.form.title")}>
          <TextInput
            value={values.title}
            onChangeText={(text) => setValues((prev) => ({ ...prev, title: text }))}
            placeholder={t("room.form.titlePh")}
            placeholderTextColor={color.placeholder}
            style={fieldStyle}
          />
        </Field>

        <Field label={t("room.form.description")}>
          <TextInput
            value={values.description}
            onChangeText={(text) => setValues((prev) => ({ ...prev, description: text }))}
            placeholder={t("room.form.descriptionPh")}
            placeholderTextColor={color.placeholder}
            style={[...fieldStyle, styles.textArea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Field>

        <Field label={t("room.form.roomType")}>
          <View style={styles.chipContainer}>
            {ROOM_TYPE_ORDER.map((type) =>
              renderChip(t(roomTypeLabelKey(type)), values.roomType === type, () =>
                setValues((prev) => ({ ...prev, roomType: type }))
              )
            )}
          </View>
        </Field>

        <View style={styles.row}>
          <Field label={t("room.form.price")} style={styles.flex1}>
            <TextInput
              value={values.price ? `${values.price}` : ""}
              onChangeText={(text) =>
                setValues((prev) => ({
                  ...prev,
                  price: Number(text.replace(/[^0-9]/g, "")) || 0,
                }))
              }
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={color.placeholder}
              style={fieldStyle}
            />
          </Field>

          <Field label={t("room.form.area")} style={styles.flex1}>
            <TextInput
              value={values.area ? `${values.area}` : ""}
              onChangeText={(text) =>
                setValues((prev) => ({
                  ...prev,
                  area: Number(text.replace(/[^0-9]/g, "")) || 0,
                }))
              }
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={color.placeholder}
              style={fieldStyle}
            />
          </Field>
        </View>

        <View style={styles.row}>
          <Field label={t("room.form.capacity")} style={styles.flex1}>
            <TextInput
              value={values.capacity ? `${values.capacity}` : ""}
              onChangeText={(text) =>
                setValues((prev) => ({
                  ...prev,
                  capacity: Number(text.replace(/[^0-9]/g, "")) || 0,
                }))
              }
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={color.placeholder}
              style={fieldStyle}
            />
          </Field>
        </View>

        <Field label={t("room.form.gender")}>
          <View style={styles.chipContainer}>
            {GENDER_REQ_ORDER.map((req) =>
              renderChip(t(genderReqLabelKey(req)), values.genderRequirement === req, () =>
                setValues((prev) => ({ ...prev, genderRequirement: req }))
              )
            )}
          </View>
        </Field>
      </FormSection>

      <FormSection title={t("room.form.addressSection")}>
        <LocationPicker
          label={t("room.form.province")}
          data={cities}
          selectedValue={selectedCityId}
          onValueChange={handleCityChange}
        />

        <LocationPicker
          label={t("room.form.district")}
          data={districts}
          selectedValue={selectedDistrictId}
          onValueChange={handleDistrictChange}
          disabled={!selectedCityId}
        />

        <LocationPicker
          label={t("room.form.ward")}
          data={wards}
          selectedValue={selectedWardId}
          onValueChange={(id) => setSelectedWardId(id)}
          disabled={!selectedDistrictId}
        />

        <Field label={t("room.form.street")}>
          <TextInput
            value={values.address.streetAddress}
            onChangeText={(text) => setValues((prev) => ({ ...prev, address: { ...prev.address, streetAddress: text } }))}
            placeholder={t("room.form.streetPh")}
            placeholderTextColor={color.placeholder}
            style={[fieldStyle, { marginTop: 12 }]}
          />
        </Field>
      </FormSection>

      <FormSection title={t("room.form.mediaSection")}>
        <ImageUploadSection
          data={images}
          onChange={setImages}
        />

      </FormSection>

      <FormSection title={t("room.form.amenitiesSection")}>
        <AmenitiesChipList
          amenities={amenities}
          selectable
          selectedAmenities={values.amenities}
          onToggleAmenity={toggleAmenity}
        />
      </FormSection>

      <Pressable
        onPress={() => !isSubmitting && handleSubmit()} // Chặn bấm liên tục khi đang load
        disabled={isSubmitting}
        style={[
          styles.submitButton,
          {
            borderColor: color.primary,
            backgroundColor: isSubmitting ? color.border : color.primary, // Đổi màu xám khi đang load
          },
        ]}
      >
        {isSubmitting ? (
          // 2. Hiển thị vòng xoay tròn
          <ActivityIndicator size="small" color={color.primaryText} />
        ) : (
          <ThemedText type="defaultSemiBold" style={{ color: color.primaryText }}>
            {submitLabel}
          </ThemedText>
        )}
      </Pressable>
      {isSubmitting && (
        <BlurView
          intensity={60}
          tint={color.background === '#fff' ? "light" : "dark"}
          style={styles.loadingOverlay}
        >
          <View style={[styles.loadingContainer, { backgroundColor: color.background }]}>
            <ActivityIndicator size="large" color={color.primary} />
            <ThemedText style={{ marginTop: 16, fontWeight: "600" }}>{t("room.form.processing")}</ThemedText>
          </View>
        </BlurView>
      )}
    </ScrollView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  submitButton: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: "continuous",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 24,
    borderCurve: "continuous",
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
});
