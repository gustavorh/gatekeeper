import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración — GateKeeper",
  description: "Panel de administración del sistema",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
