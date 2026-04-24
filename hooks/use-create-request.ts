import { useCallback, useState } from "react";

import { useLanguage } from "@/hooks/use-language";
import { requestService } from "@/services/request-service";
import type { RequestRequest } from "@/data/request";
import type { RequestResponse } from "@/types/request";

export type UseCreateRequestResult = {
  create: (payload: RequestRequest) => Promise<RequestResponse | null>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
};

/** Create roommate invitation (POST /requests). Errors from backend (e.g. duplicate, cooldown) are set in error. */
export function useCreateRequest(): UseCreateRequestResult {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: RequestRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        return await requestService.create(payload);
      } catch (err) {
        const raw = typeof err === "string" ? err : "";
        if (raw && raw in REQUEST_ERROR_KEY_BY_MESSAGE) {
          setError(
            t(
              REQUEST_ERROR_KEY_BY_MESSAGE[
                raw as keyof typeof REQUEST_ERROR_KEY_BY_MESSAGE
              ],
            ),
          );
        } else if (raw) {
          setError(raw);
        } else {
          setError(t("request.errors.sendFailed"));
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  const resetError = useCallback(() => setError(null), []);

  return { create, isLoading, error, resetError };
}

/** Map exact backend/client error strings to i18n keys (extend when API stabilizes). */
const REQUEST_ERROR_KEY_BY_MESSAGE = {
  "Đã tồn tại lời mời giữa bạn và người dùng này (đang chờ hoặc đã chấp nhận).":
    "request.errors.duplicate",
  "Bạn có thể gửi lời mời mới sau thời gian chờ.": "request.errors.cooldown",
  "Chỉ người nhận mới có thể chấp nhận hoặc từ chối lời mời này.":
    "request.errors.notReceiver",
  "Bạn không thể gửi lời mời cho chính mình.": "request.errors.cannotSendToSelf",
} as const;
