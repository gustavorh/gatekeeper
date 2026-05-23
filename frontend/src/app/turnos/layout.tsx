import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turnos — GateKeeper",
  description: "Historial y gestión de turnos laborales",
};

export default function TurnosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
