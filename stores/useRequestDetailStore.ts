import { create } from "zustand";
import type { RequestResponse } from "@/types/request";

export type RequestVariant = "incoming" | "outgoing";

interface RequestDetailState {
  request: RequestResponse | null;
  variant: RequestVariant | null;
  setRequest: (request: RequestResponse | null, variant?: RequestVariant | null) => void;
}

/** Holds the selected request and variant when navigating to request detail (no GET by id API). */
export const useRequestDetailStore = create<RequestDetailState>((set) => ({
  request: null,
  variant: null,
  setRequest: (request, variant = null) =>
    set({ request, variant: request && variant ? variant : null }),
}));
