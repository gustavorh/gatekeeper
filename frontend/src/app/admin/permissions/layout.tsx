import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Permisos — GateKeeper",
  description: "Administra permisos del sistema",
};

export default function PermissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
