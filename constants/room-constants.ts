import { RoomFormValues } from "@/types/Room";
import { GenderRequirement, RoomType } from "@/types/enums";

export const ROOM_CONSTANTS = {
}

export const EMPTY_ROOM_FORM: RoomFormValues = {
  title: "",
  price: 0,
  area: 0,
  capacity: 1,
  roomType: RoomType.MOTEL,
  genderRequirement: GenderRequirement.ANY,
  description: "",
  address: {
    city: "",
    district: "",
    ward: "",
    streetAddress: "",
  },
  images: [] as string[],
  amenities: [],
};

export const IMAGE_CONSTANTS = {
  IMAGE_PICKER: {
    MAX_SELECTION: 5, 
    MAX_COUNT: 10, 
  },
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.MOTEL]: "Phòng trọ",
  [RoomType.MINI_APARTMENT]: "Chung cư mini",
  [RoomType.APARTMENT]: "Chung cư",
  [RoomType.STUDIO]: "Studio",
  [RoomType.DORMITORY]: "Ký túc xá",
  [RoomType.WHOLE_HOUSE]: "Nhà nguyên căn",
  [RoomType.SHARED_ROOM]: "Phòng ở ghép",
};

export const GENDER_REQ_LABELS: Record<GenderRequirement, string> = {
  [GenderRequirement.ANY]: "Tất cả",
  [GenderRequirement.MALE_ONLY]: "Chỉ Nam",
  [GenderRequirement.FEMALE_ONLY]: "Chỉ Nữ",
};