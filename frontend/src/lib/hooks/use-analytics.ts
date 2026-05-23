"use client";

import useSWR from "swr";

export interface WorkHoursSummary {
  totalWorkedHours: number;
  totalLunchTime: number;
  totalBreakTime: number;
  daysWorked: number;
  averageWorkedHoursPerDay: number;
  averageLunchTimePerDay: number;
  period: "week" | "month";
  startDate: string;
  endDate: string;
  dailyBreakdown: Array<{
    date: string;
    workedHours: number;
    lunchTime: number;
    breakTime: number;
    clockInTime: string;
    clockOutTime?: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
  }>;
}

export const ANALYTICS_KEYS = {
  week: "/analytics/work-hours/current-week",
  month: "/analytics/work-hours/current-month",
} as const;

export function useWeeklyAnalytics() {
  return useSWR<WorkHoursSummary>(ANALYTICS_KEYS.week);
}

export function useMonthlyAnalytics() {
  return useSWR<WorkHoursSummary>(ANALYTICS_KEYS.month);
}
