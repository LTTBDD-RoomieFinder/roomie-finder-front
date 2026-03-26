import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { authService } from "@/services/auth";

import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, FieldNamesMarkedBoolean, useForm } from "react-hook-form";

import { profileApi } from "@/apis/profile";
import { tagApi } from "@/apis/tag";
import { Gender } from "@/constants/gender";
import {
  BaseProfileRequest,
  CreateProfileRequest,
  ProfileOptionalFields,
  UpdateProfileRequest,
} from "@/data/request";
import { Profile } from "@/types/Profile";

import ImageUploadSection from "@/components/ui/image-upload-section";
import LocationPicker from "@/components/ui/location-picker";
import { locationService } from "@/services/location-service";
import { City, District, Ward } from "@/types/Address";

import ConfirmModal from "@/components/ui/confirm-modal";
import DirtyLeaveModal from "@/components/ui/dirty-leave-modal";
import { Tag } from "@/types/Tag";
import { useNavigation } from "@react-navigation/native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { profileTabGuard } from "@/utils/profile-tab-guard";

type FormValues = {
  fullName: string;
  gender: string;
  budgetMin: number;
  budgetMax: number;
  isSmoker: boolean | null;
  hasPet: boolean | null;
  sleepSchedule: string;
  cleanliness: number | undefined;
  hometown: string;
  workplace: string;
  streetAddress: string;
  cityId: number | undefined;
  districtId: number | undefined;
  wardId: number | undefined;
  tagIds: number[];
  avatarUrl: string;
};

function buildProfilePayload(
  data: FormValues,
  dirtyFields: FieldNamesMarkedBoolean<FormValues>
): CreateProfileRequest | UpdateProfileRequest {
  const tagIds = !data.tagIds || data.tagIds.length === 0 ? [1] : data.tagIds;

  const base: BaseProfileRequest = {
    fullName: data.fullName,
    gender: data.gender as Gender,
    avatarUrl: data.avatarUrl || "",
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    hometown: data.hometown,
    workplace: data.workplace || "",
    streetAddress: data.streetAddress,
    wardId: data.wardId as number,
    districtId: data.districtId as number,
    cityId: data.cityId as number,
    tagIds,
  };

  const optional: ProfileOptionalFields = {};
  if (dirtyFields.isSmoker) optional.isSmoker = data.isSmoker;
  if (dirtyFields.hasPet) optional.hasPet = data.hasPet;
  if (dirtyFields.sleepSchedule) {
    optional.sleepSchedule = data.sleepSchedule.trim() === "" ? null : data.sleepSchedule;
  }
  if (dirtyFields.cleanliness) {
    optional.cleanliness =
      data.cleanliness === undefined || data.cleanliness === null ? null : data.cleanliness;
  }

  return { ...base, ...optional };
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { color, scheme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [isCreated, setIsCreated] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);
  const [confirmConfig, setConfirmConfig] = useState({ title: "", message: "" });

  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const pendingNavRef = useRef<"home" | "room" | "requests" | "chats" | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields, isDirty },
    reset,
  } = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
    defaultValues: {
      fullName: "",
      gender: "",
      budgetMin: 0,
      budgetMax: 0,
      isSmoker: null,
      hasPet: null,
      sleepSchedule: "",
      cleanliness: undefined,
      hometown: "",
      workplace: "",
      streetAddress: "",
      cityId: undefined,
      districtId: undefined,
      wardId: undefined,
      tagIds: [],
      avatarUrl: "",
    },
  });

  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const cityId = watch("cityId");
  const districtId = watch("districtId");
  const wardId = watch("wardId");

  const dirtyFieldsRef = useRef(dirtyFields);
  dirtyFieldsRef.current = dirtyFields;

  const isDark = scheme === "dark";
  const onPrimary = isDark ? "#151718" : "#fff";
  const primaryLight = isDark ? "#1f3333" : "#e6faf9";
  const primaryBorder = isDark ? "#2e5c58" : "#99ddd9";

  useEffect(() => {
    profileTabGuard.setDirty(isDirty);
  }, [isDirty]);

  useEffect(() => {
    return profileTabGuard.subscribe((target) => {
      pendingNavRef.current = target;
      setLeaveModalVisible(true);
    });
  }, []);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      backgroundColor: color.background,
    },
    header: {
      height: 100,
      marginTop: 40,
      justifyContent: "flex-end",
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    headerIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: { flex: 1 },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: 0.3,
      color: onPrimary,
    },
    headerSubtitle: {
      fontSize: 14,
      marginTop: 4,
      lineHeight: 20,
      color: onPrimary,
      opacity: 0.9,
    },
    card: {
      backgroundColor: color.backgroundSecondary,
      padding: 20,
      borderRadius: 16,
      marginBottom: 20,
      marginTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: color.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 10,
    },
    sectionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: primaryLight,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: color.primary,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignSelf: "center",
      marginBottom: 16,
      borderWidth: 3,
      borderColor: color.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: color.textSecondary,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: color.border,
      padding: 14,
      borderRadius: 12,
      marginBottom: 4,
      color: color.text,
      backgroundColor: color.background,
      fontSize: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    inputError: {
      borderColor: color.error,
    },
    errorText: {
      color: color.error,
      fontSize: 12,
      marginBottom: 8,
    },
    row: { flexDirection: "row", gap: 12 },
    inputHalf: {
      borderWidth: 1,
      borderColor: color.border,
      padding: 14,
      borderRadius: 12,
      color: color.text,
      backgroundColor: color.background,
      fontSize: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: color.background,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    preview: {
      marginTop: 12,
      color: color.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      padding: 12,
      backgroundColor: primaryLight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: primaryBorder,
    },
    genderRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 4,
    },
    genderOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: color.border,
      alignItems: "center",
      backgroundColor: color.background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    genderOptionActive: {
      backgroundColor: primaryLight,
      borderColor: color.primary,
      shadowColor: color.primary,
      shadowOpacity: 0.2,
    },
    genderOptionText: {
      fontSize: 15,
      fontWeight: "500",
      color: color.textSecondary,
    },
    genderOptionTextActive: {
      color: color.primary,
      fontWeight: "600",
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    tag: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: primaryLight,
      borderWidth: 1,
      borderColor: primaryBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tagActive: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: color.primary,
      marginRight: 8,
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    tagTextActive: {
      color: onPrimary,
      fontWeight: "600",
    },
    saveBtn: {
      backgroundColor: color.primary,
      padding: 18,
      borderRadius: 14,
      marginBottom: 16,
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    saveText: {
      textAlign: "center",
      color: onPrimary,
      fontWeight: "bold",
      fontSize: 16,
    },
    logoutBtn: {
      marginTop: 8,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: isDark ? "#2d1515" : "#FEE2E2",
      borderWidth: 1,
      borderColor: isDark ? "#5c2020" : "#FECACA",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    logoutText: {
      color: color.error,
      fontWeight: "600",
      fontSize: 16,
    },
    triRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    triBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: color.border,
      alignItems: "center",
      backgroundColor: color.background,
    },
    triBtnActive: {
      borderColor: color.primary,
      backgroundColor: primaryLight,
    },
    triBtnText: {
      fontSize: 14,
      color: color.textSecondary,
    },
    triBtnTextActive: {
      color: color.primary,
      fontWeight: "600",
    },
  });

  const openConfirm = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => {
    setConfirmConfig({ title: config.title, message: config.message });
    setConfirmAction(() => config.onConfirm);
    setConfirmVisible(true);
  };

  const populateForm = useCallback(
    (p: Profile) => {
      reset({
        fullName: p.fullName,
        gender: p.gender,
        budgetMin: p.budgetMin,
        budgetMax: p.budgetMax,
        isSmoker: p.isSmoker ?? null,
        hasPet: p.hasPet ?? null,
        sleepSchedule: p.sleepSchedule ?? "",
        cleanliness: p.cleanliness ?? undefined,
        hometown: p.hometown,
        workplace: p.workplace || "",
        streetAddress: p.address?.streetAddress ?? "",
        tagIds: p.tags?.map((t) => Number(t.id)) || [],
        avatarUrl: p.avatarUrl || "",
        cityId: undefined,
        districtId: undefined,
        wardId: undefined,
      });
      if (p.avatarUrl) setImages([p.avatarUrl]);
    },
    [reset]
  );

  const fetchProfile = useCallback(async () => {
    try {
      const res = await profileApi.getProfile();
      const p: Profile = res.data;
      setProfile(p);
      setIsCreated(true);
      populateForm(p);
    } catch {
      setIsCreated(false);
    } finally {
      setLoading(false);
    }
  }, [populateForm]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagApi.getTag();
      setTags(res.data);
    } catch (err: unknown) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchTags();
    locationService.getCities().then(setCities);
  }, [fetchProfile, fetchTags]);

  useEffect(() => {
    if (cityId) {
      locationService.getDistricts(cityId).then(setDistricts);
      setValue("districtId", undefined);
      setValue("wardId", undefined);
    }
  }, [cityId, setValue]);

  useEffect(() => {
    if (districtId) {
      locationService.getWards(districtId).then(setWards);
      setValue("wardId", undefined);
    }
  }, [districtId, setValue]);

  useEffect(() => {
    if (!profile || !cities.length) return;
    const cityName = profile.address?.city?.name;
    const city = cityName ? cities.find((c) => c.name === cityName) : undefined;
    if (city) setValue("cityId", city.id);
  }, [cities, profile, setValue]);

  useEffect(() => {
    if (!profile || !districts.length) return;
    const districtName = profile.address?.district?.name;
    const district = districtName
      ? districts.find((d) => d.name === districtName)
      : undefined;
    if (district) setValue("districtId", district.id);
  }, [districts, profile, setValue]);

  useEffect(() => {
    if (!profile || !wards.length) return;
    const wardName = profile.address?.ward?.name;
    const ward = wardName ? wards.find((w) => w.name === wardName) : undefined;
    if (ward) setValue("wardId", ward.id);
  }, [wards, profile, setValue]);

  const submitProfile = useCallback(
    async (
      data: FormValues,
      dirtySnapshot: FieldNamesMarkedBoolean<FormValues>,
      options?: { showSuccessAlert?: boolean }
    ) => {
      const merged: FormValues = {
        ...data,
        avatarUrl: images[0] || data.avatarUrl || "",
      };

      const payload: UpdateProfileRequest | CreateProfileRequest = buildProfilePayload(
        merged,
        dirtySnapshot
      );

      if (isCreated) await profileApi.updateProfile(payload);
      else await profileApi.createProfile(payload);

      if (options?.showSuccessAlert !== false) {
        Alert.alert("Lưu thay đổi thành công!");
      }

      reset(merged);
    },
    [images, isCreated, reset]
  );

  const onSubmit = async (data: FormValues) => {
    const snapshot = { ...dirtyFieldsRef.current };
    await submitProfile(data, snapshot, { showSuccessAlert: true });
  };

  const navigateToPendingTab = useCallback(() => {
    const target = pendingNavRef.current;
    pendingNavRef.current = null;
    if (!target) return;
    const nav = navigation as {
      navigate: (name: string, params?: { screen: string }) => void;
    };
    if (target === "room") {
      nav.navigate("room", { screen: "index" });
    } else {
      nav.navigate(target);
    }
  }, [navigation]);

  const handleLeaveSave = useCallback(() => {
    handleSubmit(
      async (data) => {
        setLeaveSaving(true);
        try {
          const snapshot = { ...dirtyFieldsRef.current };
          await submitProfile(data, snapshot, { showSuccessAlert: false });
          setLeaveModalVisible(false);
          navigateToPendingTab();
        } finally {
          setLeaveSaving(false);
        }
      },
      () => {}
    )();
  }, [handleSubmit, navigateToPendingTab, submitProfile]);

  const handleLeaveDiscard = useCallback(async () => {
    setLeaveModalVisible(false);
    try {
      const res = await profileApi.getProfile();
      const p: Profile = res.data;
      setProfile(p);
      populateForm(p);
    } catch {
      /* keep form if refetch fails */
    }
    navigateToPendingTab();
  }, [navigateToPendingTab, populateForm]);

  const handleLeaveStay = useCallback(() => {
    pendingNavRef.current = null;
    setLeaveModalVisible(false);
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} color={color.primary} />;
  }

  return (
    <>
      <View style={[styles.header, { backgroundColor: color.primary }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconWrap, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <IconSymbol name="person.fill" size={30} color={onPrimary} />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText style={[styles.headerTitle, { color: onPrimary }]}>Hồ sơ</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: onPrimary, opacity: 0.9 }]}>
              Thông tin cá nhân của bạn
            </ThemedText>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <IconSymbol name="camera.fill" size={18} color={color.primary} />
            </View>
            <ThemedText style={styles.sectionTitle}>Ảnh đại diện</ThemedText>
          </View>
          <ImageUploadSection data={images} onChange={setImages} isProfile />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <IconSymbol name="person.fill" size={18} color={color.primary} />
            </View>
            <ThemedText style={styles.sectionTitle}>Thông tin cơ bản</ThemedText>
          </View>

          <ThemedText style={styles.label}>Họ tên</ThemedText>
          <Controller
            control={control}
            name="fullName"
            rules={{ required: "Vui lòng nhập họ tên" }}
            render={({ field }) => (
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Họ tên"
                placeholderTextColor={color.placeholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.fullName?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.fullName.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Giới tính</ThemedText>
          <Controller
            control={control}
            name="gender"
            rules={{ required: "Vui lòng chọn giới tính" }}
            render={({ field }) => (
              <View style={styles.genderRow}>
                {[
                  { label: "Nam", value: "MALE" },
                  { label: "Nữ", value: "FEMALE" },
                  { label: "Khác", value: "OTHER" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.genderOption,
                      field.value === opt.value && styles.genderOptionActive,
                      errors.gender && styles.inputError,
                    ]}
                    onPress={() => field.onChange(opt.value)}
                  >
                    <ThemedText
                      style={[
                        styles.genderOptionText,
                        field.value === opt.value && styles.genderOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.gender?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.gender.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Quê quán</ThemedText>
          <Controller
            control={control}
            name="hometown"
            rules={{ required: "Vui lòng nhập quê quán" }}
            render={({ field }) => (
              <TextInput
                style={[styles.input, errors.hometown && styles.inputError]}
                placeholder="Quê quán"
                placeholderTextColor={color.placeholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.hometown?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.hometown.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Nơi làm việc</ThemedText>
          <Controller
            control={control}
            name="workplace"
            render={({ field }) => (
              <TextInput
                style={[styles.input, { marginBottom: 0 }]}
                placeholder="Nơi làm việc"
                placeholderTextColor={color.placeholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <IconSymbol name="heart.fill" size={18} color={color.primary} />
            </View>
            <ThemedText style={styles.sectionTitle}>Lối sống</ThemedText>
          </View>

          <ThemedText style={styles.label}>Giờ ngủ</ThemedText>
          <Controller
            control={control}
            name="sleepSchedule"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                placeholder="vd: 23:00 - 07:00"
                placeholderTextColor={color.placeholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          <ThemedText style={styles.label}>Độ sạch sẽ (1–5)</ThemedText>
          <Controller
            control={control}
            name="cleanliness"
            render={({ field }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="1–5 (để trống nếu không áp dụng)"
                placeholderTextColor={color.placeholder}
                value={field.value === undefined || field.value === null ? "" : String(field.value)}
                onChangeText={(v) => {
                  if (v.trim() === "") field.onChange(undefined);
                  else {
                    const n = Number(v);
                    field.onChange(Number.isNaN(n) ? undefined : n);
                  }
                }}
              />
            )}
          />

          <ThemedText style={styles.label}>Hút thuốc</ThemedText>
          <Controller
            control={control}
            name="isSmoker"
            render={({ field }) => (
              <View style={styles.triRow}>
                {(
                  [
                    { label: "Chưa chọn", value: null as boolean | null },
                    { label: "Có", value: true },
                    { label: "Không", value: false },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      styles.triBtn,
                      field.value === opt.value && styles.triBtnActive,
                    ]}
                    onPress={() => field.onChange(opt.value)}
                  >
                    <ThemedText
                      style={[
                        styles.triBtnText,
                        field.value === opt.value && styles.triBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <ThemedText style={styles.label}>Có thú cưng</ThemedText>
          <Controller
            control={control}
            name="hasPet"
            render={({ field }) => (
              <View style={styles.triRow}>
                {(
                  [
                    { label: "Chưa chọn", value: null as boolean | null },
                    { label: "Có", value: true },
                    { label: "Không", value: false },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      styles.triBtn,
                      field.value === opt.value && styles.triBtnActive,
                    ]}
                    onPress={() => field.onChange(opt.value)}
                  >
                    <ThemedText
                      style={[
                        styles.triBtnText,
                        field.value === opt.value && styles.triBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <IconSymbol name="dollarsign.circle.fill" size={18} color={color.primary} />
            </View>
            <ThemedText style={styles.sectionTitle}>Ngân sách (VNĐ/tháng)</ThemedText>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>Tối thiểu</ThemedText>
              <Controller
                control={control}
                name="budgetMin"
                rules={{
                  required: "Bắt buộc",
                  validate: (v) =>
                    (typeof v === "number" && !Number.isNaN(v) && v >= 0) || "Nhập số hợp lệ",
                }}
                render={({ field }) => (
                  <TextInput
                    style={[styles.inputHalf, errors.budgetMin && styles.inputError]}
                    keyboardType="numeric"
                    placeholder="Min"
                    placeholderTextColor={color.placeholder}
                    value={field.value?.toString() ?? ""}
                    onChangeText={(v) => field.onChange(v === "" ? 0 : Number(v))}
                  />
                )}
              />
              {errors.budgetMin?.message ? (
                <ThemedText style={styles.errorText}>{String(errors.budgetMin.message)}</ThemedText>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>Tối đa</ThemedText>
              <Controller
                control={control}
                name="budgetMax"
                rules={{
                  required: "Bắt buộc",
                  validate: (v, form) => {
                    if (typeof v !== "number" || Number.isNaN(v) || v < 0) return "Nhập số hợp lệ";
                    if (v < (form.budgetMin ?? 0)) return "Tối đa phải ≥ tối thiểu";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <TextInput
                    style={[styles.inputHalf, errors.budgetMax && styles.inputError]}
                    keyboardType="numeric"
                    placeholder="Max"
                    placeholderTextColor={color.placeholder}
                    value={field.value?.toString() ?? ""}
                    onChangeText={(v) => field.onChange(v === "" ? 0 : Number(v))}
                  />
                )}
              />
              {errors.budgetMax?.message ? (
                <ThemedText style={styles.errorText}>{String(errors.budgetMax.message)}</ThemedText>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <IconSymbol name="location.fill" size={18} color={color.primary} />
            </View>
            <ThemedText style={styles.sectionTitle}>Địa chỉ</ThemedText>
          </View>

          <ThemedText style={styles.label}>Số nhà, tên đường</ThemedText>
          <Controller
            control={control}
            name="streetAddress"
            rules={{ required: "Vui lòng nhập địa chỉ" }}
            render={({ field }) => (
              <TextInput
                style={[styles.input, errors.streetAddress && styles.inputError]}
                placeholder="Số nhà, tên đường"
                placeholderTextColor={color.placeholder}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {errors.streetAddress?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.streetAddress.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Thành phố</ThemedText>
          <Controller
            control={control}
            name="cityId"
            rules={{
              validate: (v) => (v !== undefined && v !== null) || "Chọn thành phố",
            }}
            render={({ field }) => (
              <LocationPicker
                label="Thành phố"
                data={cities}
                selectedValue={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
          {errors.cityId?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.cityId.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Quận / Huyện</ThemedText>
          <Controller
            control={control}
            name="districtId"
            rules={{
              validate: (v) => (v !== undefined && v !== null) || "Chọn quận/huyện",
            }}
            render={({ field }) => (
              <LocationPicker
                label="Quận / Huyện"
                data={districts}
                selectedValue={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
          {errors.districtId?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.districtId.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Phường / Xã</ThemedText>
          <Controller
            control={control}
            name="wardId"
            rules={{
              validate: (v) => (v !== undefined && v !== null) || "Chọn phường/xã",
            }}
            render={({ field }) => (
              <LocationPicker
                label="Phường / Xã"
                data={wards}
                selectedValue={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
          {errors.wardId?.message ? (
            <ThemedText style={styles.errorText}>{String(errors.wardId.message)}</ThemedText>
          ) : null}

          <ThemedText style={styles.preview}>
            📍{" "}
            {[
              watch("streetAddress"),
              wards.find((w) => w.id === wardId)?.name,
              districts.find((d) => d.id === districtId)?.name,
              cities.find((c) => c.id === cityId)?.name,
            ]
              .filter(Boolean)
              .join(", ")}
          </ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <IconSymbol name="tag.fill" size={18} color={color.primary} />
            </View>
            <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
          </View>

          <Controller
            control={control}
            name="tagIds"
            render={({ field: { value = [], onChange } }) => {
              const selectedTags = tags?.filter((t: Tag) => value.includes(t.id));
              const availableTags = tags?.filter((t: Tag) => !value.includes(t.id));
              const removeTag = (id: number) => onChange(value.filter((t) => t !== id));
              const addTag = (id: number) => onChange([...value, id]);

              return (
                <>
                  <View style={styles.tagRow}>
                    {selectedTags.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.tagActive}
                        onPress={() => removeTag(t.id)}
                      >
                        <ThemedText style={styles.tagTextActive}>
                          {t.tag} ✕
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {availableTags.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <ThemedText style={{ marginBottom: 6, color: color.textSecondary }}>
                        Thêm tag
                      </ThemedText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {availableTags.map((t) => (
                          <TouchableOpacity
                            key={t.id}
                            style={styles.tag}
                            onPress={() => addTag(t.id)}
                          >
                            <ThemedText style={{ color: color.primary }}>{t.tag}</ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              );
            }}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() =>
            openConfirm({
              title: "Xác nhận cập nhật",
              message: "Bạn có chắc muốn lưu thay đổi?",
              onConfirm: () => {
                handleSubmit(onSubmit)();
              },
            })
          }
        >
          <ThemedText style={styles.saveText}>Cập nhật</ThemedText>
        </TouchableOpacity>

        <Pressable
          style={styles.logoutBtn}
          onPress={() =>
            openConfirm({
              title: "Đăng xuất",
              message: "Bạn có chắc muốn đăng xuất?",
              onConfirm: authService.logout,
            })
          }
        >
          <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          confirmAction && confirmAction();
        }}
      />

      <DirtyLeaveModal
        visible={leaveModalVisible}
        saving={leaveSaving}
        onSave={handleLeaveSave}
        onStay={handleLeaveStay}
        onDiscard={handleLeaveDiscard}
      />
    </>
  );
}
