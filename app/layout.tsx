import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Análisis de Telemetría",
  description: "Laboratorio privado para analizar rutas, consumo y estrategia de conducción.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
