import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navigation from "./_components/Navigation";
import ThemedFooter from "./_components/ThemedFooter";
import HalloweenEffects from "./_components/HalloweenEffects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const heading = Orbitron({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Catalogue Spectre",
  description: "Catalogue de décors avec recherche et liste d'envoi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        {/* Preconnect to Google Fonts for theme fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload ALL theme fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Creepster&family=Mountains+of+Christmas:wght@400;700&family=Pacifico&family=Fredoka+One&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');
        ` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${heading.variable} antialiased flex flex-col min-h-screen`}>
        <Providers>
          <HalloweenEffects />
          <Navigation />
        <main 
          className="flex-1 bg-gradient-to-br from-gray-50 to-white"
          style={{
            backgroundColor: 'var(--theme-background, #fafafa)',
          }}
        >
          {children}
        </main>
        <ThemedFooter />
        </Providers>
      </body>
    </html>
  );
}
