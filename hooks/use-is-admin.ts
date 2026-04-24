import { useMemo } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { decodeJwtPayload, jwtIndicatesAdmin } from "@/utils/jwt";

export function useIsAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMemo(() => {
    if (user?.roles?.some((r) => r === "ADMIN" || r === "ROLE_ADMIN")) return true;
    if (!accessToken) return false;
    return jwtIndicatesAdmin(decodeJwtPayload(accessToken));
  }, [user, accessToken]);
}
