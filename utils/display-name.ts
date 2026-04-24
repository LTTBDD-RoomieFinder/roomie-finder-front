/**
 * Chuẩn hoá login (username) để hiển thị: bỏ @, thay _, ., gạch ngang bằng khoảng trắng.
 * Họ tên thật (fullName) không qua hàm này — giữ nguyên dấu gạch nếu có trong tên.
 */
export function humanizeLoginHandle(handle: string): string {
  return handle
    .trim()
    .replace(/^@+/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ưu tiên họ tên; không có thì hiển thị username đã humanize. */
export function formatPublicDisplayName(
  fullName: string | null | undefined,
  username: string | null | undefined,
  fallback: string,
): string {
  const fn = fullName?.trim();
  if (fn) return fn;
  const u = username?.trim();
  if (u) return humanizeLoginHandle(u);
  return fallback;
}

/** `userId` trong URL có phải số nguyên dương (dùng cho review API). */
export function isNumericUserIdParam(key: string): boolean {
  if (!key?.trim()) return false;
  return /^\d+$/.test(key.trim());
}
