import type { Metadata } from "next";
import { publicPath } from "@/lib/public-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Operativa Policía Local",
  description: "Consulta rápida de conocimiento operativo policial estructurado.",
  icons: {
    icon: publicPath("/favicon.svg"),
    shortcut: publicPath("/favicon.svg"),
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
