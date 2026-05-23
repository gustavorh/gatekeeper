import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — GateKeeper",
  description: "Panel de control de asistencia laboral",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
