import { RoomFormValues } from "@/types/Room";
import { GenderRequirement, RoomType } from "@/types/enums";

export const ROOM_CONSTANTS = {};

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
};

/** Stable iteration order for room type chips (matches `room.type.*` i18n keys). */
export const ROOM_TYPE_ORDER: RoomType[] = [
  RoomType.MOTEL,
  RoomType.MINI_APARTMENT,
  RoomType.APARTMENT,
  RoomType.STUDIO,
  RoomType.DORMITORY,
  RoomType.WHOLE_HOUSE,
  RoomType.SHARED_ROOM,
];

export const GENDER_REQ_ORDER: GenderRequirement[] = [
  GenderRequirement.ANY,
  GenderRequirement.MALE_ONLY,
  GenderRequirement.FEMALE_ONLY,
];
