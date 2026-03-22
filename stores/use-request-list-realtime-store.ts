import { create } from "zustand";

/**
 * Tăng khi có thông báo REQUEST_* qua STOMP (đăng ký ở root layout).
 * Màn Requests subscribe để refetch danh sách khi đang mở (không cần rời tab rồi vào lại).
 */
type State = {
  requestListSeq: number;
  bumpRequestList: () => void;
};

export const useRequestListRealtimeStore = create<State>((set) => ({
  requestListSeq: 0,
  bumpRequestList: () =>
    set((s) => ({ requestListSeq: s.requestListSeq + 1 })),
}));
