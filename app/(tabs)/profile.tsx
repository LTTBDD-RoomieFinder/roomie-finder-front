import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { authService } from "@/services/auth";

import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { profileApi } from "@/apis/profile";
import { tagApi } from "@/apis/tag";
import { Profile } from "@/types/Profile";

import ImageUploadSection from "@/components/ui/image-upload-section";
import LocationPicker from "@/components/ui/location-picker";
import { locationService } from "@/services/location-service";
import { City, District, Ward } from "@/types/Address";

import { Tag } from "@/types/Tag";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

type FormValues = {
  fullName: string;
  gender: string;
  budgetMin: number;
  budgetMax: number;
  isSmoker: boolean;
  hasPet: boolean;
  sleepSchedule: string;
  cleanliness: number;
  hometown: string;
  workplace: string;
  streetAddress: string;
  cityId: number;
  districtId: number;
  wardId: number;
  tagIds: number[];
  avatarUrl: string;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [isCreated, setIsCreated] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [tags, setTags] = useState<Tag[]>([]);

  const { control, handleSubmit, setValue, watch, formState, reset } =
    useForm<FormValues>();

  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const cityId = watch("cityId");
  const districtId = watch("districtId");
  const wardId = watch("wardId");

  const populateForm = useCallback(
    (p: Profile) => {
      reset({
        fullName: p.fullName,
        gender: p.gender,
        budgetMin: p.budgetMin,
        budgetMax: p.budgetMax,
        isSmoker: p.isSmoker,
        hasPet: p.hasPet,
        sleepSchedule: p.sleepSchedule,
        cleanliness: p.cleanliness,
        hometown: p.hometown,
        workplace: p.workplace || "",
        streetAddress: p.address?.streetAddress ?? "",
        tagIds: p.tags?.map((t) => Number(t.id)) || [],
        avatarUrl: p.avatarUrl || "",
      });

      if (p.avatarUrl) setImages([p.avatarUrl]);
    },
    [reset]
  );

  const fetchProfile = useCallback(async () => {
    try {
      const res = await profileApi.getProfile();
      const p: Profile = res.data;
      console.log(p);

      setProfile(p);
      setIsCreated(true);
      populateForm(p);
    } catch (err) {
      setIsCreated(false);
    } finally {
      setLoading(false);
    }
  }, [populateForm]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagApi.getTag();
      setTags(res.data)
    } catch (err: any) {
      console.log(err)
    }
  }, []);


  useEffect(() => {
    fetchProfile();
    fetchTags();
    locationService.getCities().then(setCities);
  }, []);

  useEffect(() => {
    if (cityId) {
      locationService.getDistricts(cityId).then(setDistricts);
      setValue("districtId", undefined as any);
      setValue("wardId", undefined as any);
    }
  }, [cityId]);

  useEffect(() => {
    if (districtId) {
      locationService.getWards(districtId).then(setWards);
      setValue("wardId", undefined as any);
    }
  }, [districtId]);

  useEffect(() => {
    if (!profile || !cities.length) return;
    const city = cities.find((c) => c.name === profile.address?.city);
    if (city) setValue("cityId", city.id);
  }, [cities, profile]);

  useEffect(() => {
    if (!profile || !districts.length) return;
    const district = districts.find(
      (d) => d.name === profile.address?.district
    );
    if (district) setValue("districtId", district.id);
  }, [districts, profile]);

  useEffect(() => {
    if (!profile || !wards.length) return;
    const ward = wards.find((w) => w.name === profile.address?.ward);
    if (ward) setValue("wardId", ward.id);
  }, [wards, profile]);

  const onSubmit = async (data: FormValues) => {
    data.avatarUrl = images[0] || data.avatarUrl || "";

    if (!data.cityId) data.cityId = cityId;
    if (!data.districtId) data.districtId = districtId;
    if (!data.wardId) data.wardId = wardId;

    if (isCreated) await profileApi.updateProfile(data as any);
    else await profileApi.createProfile(data as any);

    Alert.alert("Lưu thay đổi thành công!");
    reset(data);
  };

  const isDirtyRef = useRef(formState.isDirty);
  useEffect(() => {
    isDirtyRef.current = formState.isDirty;
  }, [formState.isDirty]);

  const pendingTabIndexRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const unsubBlur = navigation.addListener("blur" as any, () => {
        if (!isDirtyRef.current) return;

        const state = navigation.getState();
        const newIndex = state?.index;
        const profileIndex = state?.routes.findIndex((r: any) =>
          r.name.includes("profile")
        );

        if (newIndex !== profileIndex) {
          pendingTabIndexRef.current = newIndex ?? null;

          if (profileIndex !== undefined && profileIndex >= 0 && state) {
            navigation.navigate(state.routeNames[profileIndex] as never);
          }

          Alert.alert(
            "Bạn có thay đổi chưa lưu",
            "Bạn có muốn lưu các thay đổi không?",
            [
              { text: "Ở lại", style: "cancel" },
              {
                text: "Không lưu",
                style: "destructive",
                onPress: async () => {
                  await fetchProfile();
                  if (pendingTabIndexRef.current !== null) {
                    const s = navigation.getState();
                    if (s) {
                      navigation.navigate(s.routeNames[pendingTabIndexRef.current] as never);
                      pendingTabIndexRef.current = null;
                    }
                  }
                },
              },
              {
                text: "Lưu",
                onPress: () => {
                  handleSubmit(async (data) => {
                    await onSubmit(data);
                    if (pendingTabIndexRef.current !== null) {
                      const s = navigation.getState();
                      if (s) {
                        navigation.navigate(s.routeNames[pendingTabIndexRef.current] as never);
                        pendingTabIndexRef.current = null;
                      }
                    }
                  })();
                },
              },
            ]
          );
        }
      });

      return () => unsubBlur();
    }, [navigation, fetchProfile, handleSubmit])
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText style={styles.title}>Thông tin cá nhân</ThemedText>

      <View style={styles.card}>
        <Image
          source={{ uri: images[0] || "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <ImageUploadSection data={images} onChange={setImages} isProfile />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.section}>Thông tin cơ bản</ThemedText>

        <ThemedText style={styles.label}>Họ tên</ThemedText>
        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <ThemedText style={styles.label}>Giới tính</ThemedText>
        <Controller
          control={control}
          name="gender"
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
                  ]}
                  onPress={() => field.onChange(opt.value)}
                >
                  <ThemedText
                    style={[
                      styles.genderOptionText,
                      field.value === opt.value &&
                      styles.genderOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <ThemedText style={styles.label}>Quê quán</ThemedText>
        <Controller
          control={control}
          name="hometown"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              placeholder="Quê quán"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <ThemedText style={styles.label}>Nơi làm việc</ThemedText>
        <Controller
          control={control}
          name="workplace"
          render={({ field }) => (
            <TextInput
              style={[styles.input, { marginBottom: 0 }]}
              placeholder="Nơi làm việc"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.section}>Lối sống</ThemedText>

        <ThemedText style={styles.label}>Giờ ngủ</ThemedText>
        <Controller
          control={control}
          name="sleepSchedule"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              placeholder="vd: 23:00 - 07:00"
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
              placeholder="1–5"
              value={field.value?.toString()}
              onChangeText={(v) => field.onChange(Number(v))}
            />
          )}
        />

        <View style={styles.rowBetween}>
          <ThemedText>Hút thuốc</ThemedText>
          <Controller
            control={control}
            name="isSmoker"
            render={({ field }) => (
              <Switch value={field.value} onValueChange={field.onChange} />
            )}
          />
        </View>

        <View style={styles.rowBetween}>
          <ThemedText>Có thú cưng</ThemedText>
          <Controller
            control={control}
            name="hasPet"
            render={({ field }) => (
              <Switch value={field.value} onValueChange={field.onChange} />
            )}
          />
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.section}>Ngân sách (VNĐ/tháng)</ThemedText>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.label}>Tối thiểu</ThemedText>
            <Controller
              control={control}
              name="budgetMin"
              render={({ field }) => (
                <TextInput
                  style={styles.inputHalf}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={field.value?.toString()}
                  onChangeText={(v) => field.onChange(Number(v))}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.label}>Tối đa</ThemedText>
            <Controller
              control={control}
              name="budgetMax"
              render={({ field }) => (
                <TextInput
                  style={styles.inputHalf}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={field.value?.toString()}
                  onChangeText={(v) => field.onChange(Number(v))}
                />
              )}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.section}>Địa chỉ</ThemedText>

        <ThemedText style={styles.label}>Số nhà, tên đường</ThemedText>
        <Controller
          control={control}
          name="streetAddress"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              placeholder="Số nhà, tên đường"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <LocationPicker
          label="Thành phố"
          data={cities}
          selectedValue={cityId}
          onValueChange={(v) => setValue("cityId", v)}
        />

        <LocationPicker
          label="Quận / Huyện"
          data={districts}
          selectedValue={districtId}
          onValueChange={(v) => setValue("districtId", v)}
        />

        <LocationPicker
          label="Phường / Xã"
          data={wards}
          selectedValue={wardId}
          onValueChange={(v) => setValue("wardId", v)}
        />

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
        <ThemedText style={styles.section}>Tags</ThemedText>

        <Controller
          control={control}
          name="tagIds"
          render={({ field: { value = [], onChange } }) => {
            const selectedTags = tags?.filter((t: Tag) => value.includes(t.id));
            const availableTags = tags?.filter((t: Tag) => !value.includes(t.id));

            const removeTag = (id: number) => {
              onChange(value.filter((t) => t !== id));
            };

            const addTag = (id: number) => {
              onChange([...value, id]);
            };

            return (
              <>
                {/* Selected tags */}
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

                {/* Dropdown add tag */}
                {availableTags.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <ThemedText style={{ marginBottom: 6, color: "#666" }}>
                      Thêm tag
                    </ThemedText>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {availableTags.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={styles.tag}
                          onPress={() => addTag(t.id)}
                        >
                          <ThemedText>{t.tag}</ThemedText>
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit(onSubmit)}>
        <ThemedText style={styles.saveText}>
          {isCreated ? "Cập nhật" : "Tạo hồ sơ"}
        </ThemedText>
      </TouchableOpacity>

      <Pressable style={styles.logoutBtn} onPress={authService.logout}>
        <ThemedText style={{ color: "red" }}>Đăng xuất</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#F4FFF6",
    marginTop: 30,
    paddingBottom: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 10,
  },

  section: {
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2E7D32",
  },

  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  row: { flexDirection: "row", gap: 10 },

  inputHalf: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },

  preview: {
    marginTop: 10,
    color: "#555",
    fontSize: 13,
    lineHeight: 20,
  },

  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  genderOptionActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },

  genderOptionText: {
    fontSize: 14,
    color: "#666",
  },

  genderOptionTextActive: {
    color: "#2E7D32",
    fontWeight: "600",
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },

  tagText: {
    fontSize: 13,
    color: "#2E7D32",
  },

  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
  },

  saveText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },

  logoutBtn: {
    marginTop: 20,
    alignItems: "center",
  },

  tagActive: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },

  tagTextActive: {
    color: "#fff",
  },
});