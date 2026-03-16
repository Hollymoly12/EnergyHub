import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EnergyHub — Marketplace B2B Énergie Belge",
  description: "La marketplace B2B de la transition énergétique belge. Connectez industriels, installateurs, investisseurs et greentechs.",
  keywords: ["énergie", "marketplace", "B2B", "Belgique", "transition énergétique", "investissement"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
