import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración — GateKeeper",
  description: "Configura los parámetros del sistema",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
