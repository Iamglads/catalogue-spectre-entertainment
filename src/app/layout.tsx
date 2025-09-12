import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navigation from "./_components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const heading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Catalogue Spectre",
  description: "Catalogue de décors avec recherche et liste d’envoi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${heading.variable} antialiased`}>
        <Providers>
          <Navigation />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {children}
        </main>
        <footer className="border-t bg-white/80 backdrop-blur-sm">
          <div className="container-max section-padding py-8 text-center text-sm text-gray-600 space-y-2">
            <div>
              Spectre Entertainment — Tous droits réservés ·{' '}
              <a
                href="https://spectre-entertainment.com/politique-de-confidentialite/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline transition-colors"
              >
                Politique de confidentialité
              </a>
            </div>
            <div className="text-gray-500">940 Jean‑Neveu, Longueuil (Québec) J4G 2M1</div>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
