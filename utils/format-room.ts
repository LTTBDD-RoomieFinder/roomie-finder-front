import { RoomAddress } from "@/types/Room";

export const formatRoomPrice = (price: number) => {
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
};

export const formatRoomAddress = (address: RoomAddress) => {
  return `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.city}`;
};