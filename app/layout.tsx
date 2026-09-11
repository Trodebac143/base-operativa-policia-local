import type { Metadata } from "next";
import { publicPath } from "@/lib/public-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Operativa Policía Local",
  applicationName: "Base Operativa",
  description: "Consulta rápida de conocimiento operativo policial estructurado.",
  icons: {
    icon: [
      { url: publicPath("/favicon.ico"), sizes: "16x16 32x32", type: "image/x-icon" },
      { url: publicPath("/branding/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: publicPath("/branding/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
    ],
    shortcut: publicPath("/favicon.ico"),
    apple: { url: publicPath("/branding/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
  },
  manifest: publicPath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: "Base Operativa",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <div className="project-signature" aria-hidden="true">
          OFICIAL 46244143
        </div>
      </body>
    </html>
  );
}
