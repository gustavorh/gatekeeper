import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Usuarios — GateKeeper",
  description: "Administra usuarios y roles del sistema",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
