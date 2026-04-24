export function formatTimeVi(d: string): string {
  try {
    return new Date(d.replace(" ", "T")).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

