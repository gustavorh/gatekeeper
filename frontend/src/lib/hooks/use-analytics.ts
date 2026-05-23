"use client";

import useSWR from "swr";

export function useCurrentWeekAnalytics<T = unknown>() {
  return useSWR<T>("/analytics/week/current");
}

export function useCurrentMonthAnalytics<T = unknown>() {
  return useSWR<T>("/analytics/month/current");
}
