import type { ChatMessage } from "@/types/chat";

/**
 * Backend: MEMBER_KICKED:{userId}|{username}|{humanLine}
 * Legacy: MEMBER_KICKED:{userId}|{humanLine}
 */
const MEMBER_KICKED_PREFIX = "MEMBER_KICKED:";

/** Backend: MEMBER_JOINED:{userId}|{username}|{humanLine} */
const MEMBER_JOINED_PREFIX = "MEMBER_JOINED:";

const LEAVE_CONTENT_SUFFIX = " đã rời nhóm chat";

export type MembershipNoticeVariant = "leave" | "kick" | "join";

export type MembershipNoticeModel = {
  subjectUserId: number;
  displayName: string;
  variant: MembershipNoticeVariant;
};

function segmentsAfterPrefix(content: string, prefix: string): string[] {
  if (!content.startsWith(prefix)) return [];
  return content.slice(prefix.length).split("|");
}

function memberKickedRestSegments(content: string): string[] {
  return segmentsAfterPrefix(content, MEMBER_KICKED_PREFIX);
}

function memberJoinedRestSegments(content: string): string[] {
  return segmentsAfterPrefix(content, MEMBER_JOINED_PREFIX);
}

function humanLineFromTriplet(
  parts: string[],
): string | null {
  if (parts.length >= 3) {
    return parts.slice(2).join("|").trim();
  }
  if (parts.length === 2) {
    return parts[1]?.trim() || null;
  }
  return null;
}

/** Human-readable line for kicks / joins (list preview, parsing). */
export function getSystemMessageDisplayText(content: string): string {
  if (content.startsWith(MEMBER_KICKED_PREFIX)) {
    const parts = memberKickedRestSegments(content);
    return (
      humanLineFromTriplet(parts) ?? "Thành viên đã bị mời khỏi nhóm chat"
    );
  }
  if (content.startsWith(MEMBER_JOINED_PREFIX)) {
    const parts = memberJoinedRestSegments(content);
    return humanLineFromTriplet(parts) ?? "Có thành viên mới tham gia nhóm chat";
  }
  return content;
}

/** Preview line in chat room list (API may still return raw stored content). */
export function formatChatListPreview(raw: string | null | undefined): string {
  const t = raw?.trim();
  if (!t) return "";
  if (t.startsWith(MEMBER_KICKED_PREFIX) || t.startsWith(MEMBER_JOINED_PREFIX)) {
    return getSystemMessageDisplayText(t);
  }
  return t;
}

/** User id targeted by a kick event; NaN if not parseable. */
export function parseMemberKickedUserId(content: string): number {
  if (!content.startsWith(MEMBER_KICKED_PREFIX)) return NaN;
  const rest = content.slice(MEMBER_KICKED_PREFIX.length);
  const pipe = rest.indexOf("|");
  const idPart = pipe === -1 ? rest : rest.slice(0, pipe);
  return Number(idPart.trim());
}

/** Username segment from new kick format; null for legacy two-part payloads. */
export function parseMemberKickedUsername(content: string): string | null {
  const parts = memberKickedRestSegments(content);
  if (parts.length >= 3) {
    const u = parts[1]?.trim();
    return u && u.length > 0 ? u : null;
  }
  return null;
}

function parseMemberJoinedUserId(content: string): number {
  if (!content.startsWith(MEMBER_JOINED_PREFIX)) return NaN;
  const rest = content.slice(MEMBER_JOINED_PREFIX.length);
  const pipe = rest.indexOf("|");
  const idPart = pipe === -1 ? rest : rest.slice(0, pipe);
  return Number(idPart.trim());
}

function parseMemberJoinedUsername(content: string): string | null {
  const parts = memberJoinedRestSegments(content);
  if (parts.length >= 3) {
    const u = parts[1]?.trim();
    return u && u.length > 0 ? u : null;
  }
  return null;
}

function parseNameFromKickHumanLine(human: string): string | null {
  const m = human.match(/Chủ phòng đã mời\s+(.+?)\s+khỏi nhóm chat/);
  return m?.[1]?.trim() ?? null;
}

function parseNameFromJoinHumanLine(human: string): string | null {
  const m = human.match(/^(.+?)\s+đã tham gia nhóm chat$/);
  return m?.[1]?.trim() ?? null;
}

/**
 * Center “pill” row for leave/kick/join (not a normal bubble). Returns null for other SYSTEM payloads.
 */
export function getMembershipNoticeModel(
  msg: ChatMessage,
  nameByUserId: Map<number, string>,
): MembershipNoticeModel | null {
  if (msg.type !== "SYSTEM") return null;
  if (msg.content === "ROOM_DELETED") return null;

  if (msg.content.startsWith(MEMBER_KICKED_PREFIX)) {
    const uid = parseMemberKickedUserId(msg.content);
    if (Number.isNaN(uid)) return null;
    const username = parseMemberKickedUsername(msg.content);
    const fromMap = nameByUserId.get(uid)?.trim();
    const fromHuman = parseNameFromKickHumanLine(
      getSystemMessageDisplayText(msg.content),
    );
    const displayName =
      (username && username.length > 0 ? username : null) ??
      fromMap ??
      fromHuman ??
      "Thành viên";
    return { subjectUserId: uid, displayName, variant: "kick" };
  }

  if (msg.content.startsWith(MEMBER_JOINED_PREFIX)) {
    const uid = parseMemberJoinedUserId(msg.content);
    if (Number.isNaN(uid)) return null;
    const username = parseMemberJoinedUsername(msg.content);
    const fromMap = nameByUserId.get(uid)?.trim();
    const fromHuman = parseNameFromJoinHumanLine(
      getSystemMessageDisplayText(msg.content),
    );
    const displayName =
      (username && username.length > 0 ? username : null) ??
      fromMap ??
      fromHuman ??
      "Thành viên";
    return { subjectUserId: uid, displayName, variant: "join" };
  }

  if (msg.content.endsWith(LEAVE_CONTENT_SUFFIX)) {
    const fromMap = nameByUserId.get(msg.senderId)?.trim();
    const fromContent = msg.content.slice(0, -LEAVE_CONTENT_SUFFIX.length).trim();
    const name = fromMap || fromContent || "Thành viên";
    return { subjectUserId: msg.senderId, displayName: name, variant: "leave" };
  }

  return null;
}
