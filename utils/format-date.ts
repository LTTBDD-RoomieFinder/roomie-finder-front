export function formatDateVi(d: string): string {
  try {
    return new Date(d.replace(" ", "T")).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function formatDateLongVi(d: string): string {
  // Keep the existing UI behavior from RequestDetailScreen:
  // it uses toLocaleDateString with month="long" and includes hour/minute params.
  try {
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

