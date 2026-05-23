"use client";

import useSWR from "swr";

export interface ShiftHistoryResponse {
  shifts: Array<{
    id: string;
    userId: string;
    clockInTime: string;
    clockOutTime: string | null;
    lunchStartTime: string | null;
    lunchEndTime: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
}

export function useShiftHistory() {
  return useSWR<ShiftHistoryResponse>("/shifts/history");
}

export function useCurrentShift<T = unknown>() {
  return useSWR<T>("/shifts/current");
}
