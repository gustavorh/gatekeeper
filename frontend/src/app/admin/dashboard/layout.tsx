import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Admin — GateKeeper",
  description: "Estadísticas y actividad del sistema",
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
