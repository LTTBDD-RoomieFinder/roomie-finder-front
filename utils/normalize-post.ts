import type {
  AddressResponse,
  AmenityResponse,
  MapPinGeoItem,
  PostResponse,
  RoomResponse,
  UserResponse,
} from "@/data/response";
import { PostStatus } from "@/types/PostStatus";
import { GenderRequirement, RoomStatus, RoomType } from "@/types/enums";

const POST_STATUSES: PostStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "HIDDEN",
  "EXPIRED",
];

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function strNull(v: unknown): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

function normalizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function pickEnum<T extends string>(
  allowed: readonly T[],
  v: unknown,
  fallback: T,
): T {
  const s = typeof v === "string" ? v : "";
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

export function normalizeAddress(raw: unknown): AddressResponse {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      streetAddress: "",
      city: "",
      district: "",
      ward: "",
      lat: 0,
      lng: 0,
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    id: num(o.id),
    streetAddress: str(o.streetAddress ?? o.street_address),
    city: str(o.city),
    district: str(o.district),
    ward: str(o.ward),
    lat: num(o.lat),
    lng: num(o.lng),
  };
}

function normalizeAmenity(raw: unknown): AmenityResponse {
  if (!raw || typeof raw !== "object") {
    return { id: 0, name: "", iconUrl: "" };
  }
  const o = raw as Record<string, unknown>;
  return {
    id: num(o.id),
    name: str(o.name),
    iconUrl: str(o.iconUrl ?? o.icon_url),
  };
}

export function normalizeUser(raw: unknown): UserResponse {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      username: "",
      email: "",
      fullName: null,
      roles: [],
      avatarUrl: null,
    };
  }
  const o = raw as Record<string, unknown>;
  const rolesRaw = o.roles;
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.filter((x): x is string => typeof x === "string")
    : [];
  return {
    id: str(o.id),
    username: str(o.username),
    email: str(o.email),
    fullName: strNull(o.fullName ?? o.full_name),
    roles,
    avatarUrl: strNull(o.avatarUrl ?? o.avatar_url),
  };
}

export function normalizeRoom(raw: unknown): RoomResponse {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      title: "",
      price: 0,
      area: 0,
      capacity: 0,
      roomType: RoomType.MOTEL,
      genderRequirement: GenderRequirement.ANY,
      description: "",
      status: RoomStatus.ACTIVE,
      address: normalizeAddress(null),
      imageUrls: [],
      amenities: [],
      ownerId: 0,
    };
  }
  const o = raw as Record<string, unknown>;
  const amenitiesRaw = o.amenities;
  const amenities = Array.isArray(amenitiesRaw)
    ? amenitiesRaw.map(normalizeAmenity)
    : [];

  return {
    id: num(o.id),
    title: str(o.title),
    price: num(o.price),
    area: num(o.area),
    capacity: num(o.capacity),
    roomType: pickEnum(
      Object.values(RoomType) as RoomType[],
      o.roomType ?? o.room_type,
      RoomType.MOTEL,
    ),
    genderRequirement: pickEnum(
      Object.values(GenderRequirement) as GenderRequirement[],
      o.genderRequirement ?? o.gender_requirement,
      GenderRequirement.ANY,
    ),
    description: str(o.description),
    status: pickEnum(
      Object.values(RoomStatus) as RoomStatus[],
      o.status,
      RoomStatus.ACTIVE,
    ),
    address: normalizeAddress(o.address),
    imageUrls: normalizeStringArray(o.imageUrls ?? o.image_urls),
    amenities,
    ownerId: num(o.ownerId ?? o.owner_id),
  };
}

/** Unwrap `{ data: T }` once (axios body after interceptor). */
export function unwrapPostPayload(res: unknown): unknown {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: unknown }).data;
  }
  return res;
}

export function normalizePostResponse(raw: unknown): PostResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid post payload");
  }
  const o = raw as Record<string, unknown>;
  return {
    id: num(o.id),
    title: str(o.title),
    content: str(o.content),
    status: pickEnum(POST_STATUSES, o.status, "PUBLISHED"),
    viewCount: num(o.viewCount ?? o.view_count),
    expirationDate: strNull(o.expirationDate ?? o.expiration_date),
    createdAt: str(o.createdAt ?? o.created_at),
    updatedAt: str(o.updatedAt ?? o.updated_at),
    room: normalizeRoom(o.room),
    user: normalizeUser(o.user),
  };
}

/**
 * Map pin search often includes `thumbnailUrl` while full post may omit `imageUrls`.
 * Fill titles when room/post title missing.
 */
export function mergeMapPinIntoPostPreview(
  post: PostResponse,
  pin: MapPinGeoItem,
): PostResponse {
  const thumb = pin.thumbnailUrl?.trim();
  const room = post.room;
  let imageUrls = [...(room.imageUrls ?? [])];

  if (thumb) {
    if (imageUrls.length === 0) {
      imageUrls = [thumb];
    } else if (!imageUrls.includes(thumb)) {
      imageUrls = [thumb, ...imageUrls];
    }
  }

  const pinTitle = (pin.shortTitle ?? pin.title ?? "").trim();

  const nextRoomTitle = room.title?.trim() || pinTitle || room.title;
  const nextPostTitle = post.title?.trim() || pinTitle || post.title;

  return {
    ...post,
    title: nextPostTitle,
    room: {
      ...room,
      title: nextRoomTitle,
      imageUrls,
      price: Number.isFinite(room.price) && room.price > 0 ? room.price : pin.price,
    },
  };
}
