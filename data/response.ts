import { GenderRequirement, RoomStatus, RoomType } from "@/types/enums";
import { PostStatus } from "@/types/PostStatus";

export type UserResponse = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

export type RoomResponse = {
  id: number,
  title: string,
  price: number,
  area: number,
  capacity: number,
  roomType: RoomType,
  genderRequirement: GenderRequirement,
  description: string,
  status: RoomStatus,
  address: AddressResponse,
  imageUrls: string[],
  amenities: AmenityResponse[],
  ownerId: number,
}

export type AddressResponse = {
  id: number,
  streetAddress: string,
  city: string,
  district: string,
  ward: string,
  lat: number,
  lng: number,
}


export type AmenityResponse = {
  id: number,
  name: string,
  iconUrl: string,
}

export type PostResponse = {
  id: number;
  title: string;
  content: string;
  status: PostStatus;
  viewCount: number;
  expirationDate: string | null;
  createdAt: string;
  updatedAt: string;
  room: RoomResponse;
  user: UserResponse;
}
