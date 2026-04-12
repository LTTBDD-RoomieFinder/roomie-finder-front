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

// ── Identity Verification ────────────────────────────────────────────────────
export enum VerificationStatus {
  PENDING  = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED  = 'EXPIRED',
}

// ── Matching deal-breakers ───────────────────────────────────────────────────
export enum DealBreakerType {
  NO_SMOKING                = 'NO_SMOKING',
  NO_PETS                   = 'NO_PETS',
  NO_NIGHT_OWL              = 'NO_NIGHT_OWL',
  NO_EARLY_BIRD             = 'NO_EARLY_BIRD',
  SAME_GENDER_ONLY          = 'SAME_GENDER_ONLY',
  QUIET_ENVIRONMENT_REQUIRED = 'QUIET_ENVIRONMENT_REQUIRED',
  NO_FREQUENT_GUESTS        = 'NO_FREQUENT_GUESTS',
}

// ── Reviews ──────────────────────────────────────────────────────────────────
export enum ReviewContext {
  ROOMMATE_EXPERIENCE = 'ROOMMATE_EXPERIENCE',
  LANDLORD_EXPERIENCE = 'LANDLORD_EXPERIENCE',
}

// ── Reports ──────────────────────────────────────────────────────────────────
export enum ReportTargetType {
  USER = 'USER',
  POST = 'POST',
}

export enum ReportCategory {
  SCAM                 = 'SCAM',
  FAKE_LISTING         = 'FAKE_LISTING',
  IDENTITY_FRAUD       = 'IDENTITY_FRAUD',
  HARASSMENT           = 'HARASSMENT',
  SPAM                 = 'SPAM',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  OTHER                = 'OTHER',
}

export enum ReportStatus {
  PENDING    = 'PENDING',
  REVIEWED   = 'REVIEWED',
  DISMISSED  = 'DISMISSED',
  ACTIONED   = 'ACTIONED',
}
