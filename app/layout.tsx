import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Party Games",
  description: "Juegos para jugar en grupo — sin instalación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}
