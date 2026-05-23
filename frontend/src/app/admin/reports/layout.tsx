import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reportes — GateKeeper",
  description: "Exporta y consulta reportes de asistencia",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
