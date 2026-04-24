import { GenderRequirement, RoomType } from "./enums";

export type Room = {
  id: number,
  title: string,
  price: number,
  area: number,
  capacity: number,
  address: RoomAddress,
  roomImages: string[],
  roomAmenities: string[],
}

export type RoomAddress = {
  city: string,
  district: string,
  ward: string,
  streetAddress: string,
}

export type RoomFormValues = {
  title: string;
  price: number;
  area: number;
  capacity: number;
  roomType: RoomType;
  genderRequirement: GenderRequirement;
  description: string;
  address: RoomAddress;
  images: string[];
  amenities: number[];
}