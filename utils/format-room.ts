import type { LocaleCode } from "@/lib/i18n-core";
import { RoomAddress } from "@/types/Room";

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function formatRoomPrice(
  price: number,
  t: TranslateFn,
  locale: LocaleCode,
): string {
  const loc = locale === "vi" ? "vi-VN" : "en-US";
  return t("room.priceFormatted", { price: price.toLocaleString(loc) });
}

export const formatRoomAddress = (address: RoomAddress) => {
  return `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.city}`;
};
