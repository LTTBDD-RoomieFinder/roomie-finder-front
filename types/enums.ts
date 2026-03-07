export enum RoomType {
  MOTEL = 'MOTEL',          // Phòng trọ bình dân
  MINI_APARTMENT = 'MINI_APARTMENT', // Chung cư mini
  APARTMENT = 'APARTMENT',      // Chung cư nguyên căn
  STUDIO = 'STUDIO',         // Phòng Studio
  DORMITORY = 'DORMITORY',      // Ký túc xá / Sleepbox
  WHOLE_HOUSE = 'WHOLE_HOUSE',    // Nhà nguyên căn
  SHARED_ROOM = 'SHARED_ROOM'
}

export enum GenderRequirement {
  MALE_ONLY = 'MALE_ONLY',
  FEMALE_ONLY = 'FEMALE_ONLY',
  ANY = 'ANY'
}

export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  FULL = 'FULL',
  INACTIVE = 'INACTIVE'
}
