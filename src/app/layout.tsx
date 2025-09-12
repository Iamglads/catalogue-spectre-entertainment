import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ThemeToggle from "./theme-toggle";
import ListCounter from "./_components/ListCounter";
import UserButton from "./user-button";
import { Phone } from "lucide-react";

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
        <header className="sticky top-0 z-40 glass border-b border-gray-200/50">
          <div className="container-max section-padding h-16 flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Accueil catalogue">
              <Image src="/Logo.png" alt="Spectre Entertainment" width={160} height={40} className="h-8 w-auto" />
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <a
                href="tel:4503320894"
                className="hidden sm:inline-flex items-center gap-2 btn btn-ghost text-sm"
                title="Besoin d'aide ? Contactez-nous"
              >
                <Phone className="h-4 w-4" />
                450 332-0894
              </a>
              <a
                href="https://spectre-entertainment.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 btn btn-ghost text-sm"
              >
                Site principal
              </a>
              <ListCounter />
              <ThemeToggle />
              <UserButton />
            </div>
          </div>
        </header>
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
