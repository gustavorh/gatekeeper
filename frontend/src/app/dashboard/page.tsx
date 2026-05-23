import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { ANALYTICS_KEYS } from "@/lib/hooks/use-analytics";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
const AUTH_COOKIE_NAMES = ["__Host-auth_token", "auth_token"] as const;

async function serverGet(path: string, cookieHeader: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();

  let cookieHeader = "";
  for (const name of AUTH_COOKIE_NAMES) {
    const val = cookieStore.get(name)?.value;
    if (val) {
      cookieHeader = `${name}=${val}`;
      break;
    }
  }

  if (!cookieHeader) {
    redirect("/login?from=/dashboard");
  }

  const [weeklyAnalytics, monthlyAnalytics, currentShift, shiftHistory] =
    await Promise.all([
      serverGet(ANALYTICS_KEYS.week, cookieHeader),
      serverGet(ANALYTICS_KEYS.month, cookieHeader),
      serverGet("/shifts/current", cookieHeader),
      serverGet("/shifts/history?limit=1", cookieHeader),
    ]);

  const recentActivities = Array.isArray((shiftHistory as any)?.shifts)
    ? (shiftHistory as any).shifts
    : [];

  return (
    <DashboardClient
      fallback={{
        [ANALYTICS_KEYS.week]: weeklyAnalytics,
        [ANALYTICS_KEYS.month]: monthlyAnalytics,
        "/shifts/current": currentShift,
      }}
      initialRecentActivities={recentActivities}
      initialCurrentShift={currentShift}
    />
  );
}
