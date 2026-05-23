import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Roles — GateKeeper",
  description: "Administra roles y permisos del sistema",
};

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
