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
  title: {
    default: "Catalogue de Décors Événementiels | Spectre Entertainment",
    template: "%s | Spectre Entertainment"
  },
  description: "Catalogue complet de location et vente de décors pour événements, mariages, galas, tournages, productions TV et cinéma. Plus de 1000 décors thématiques disponibles à Montréal et Longueuil.",
  keywords: [
    // Location décors
    "location décors événementiels", "location décors Montréal", "location décors Longueuil",
    "location décors mariage", "location décors gala", "location mobilier événementiel",
    
    // Types événements
    "décors mariage Montréal", "décors gala Longueuil", "décors corporate",
    "décors bal de finissants", "décors party de Noël", "décors party bureau",
    "décors anniversaire", "décors réception", "décors banquet",
    
    // Production & Cinéma
    "location décors tournage", "décors production TV", "décors cinéma Montréal",
    "décors plateau télévision", "location accessoires tournage",
    
    // Thématiques
    "décors vintage", "décors rustiques", "décors champêtres", "décors industriels",
    "décors thématiques", "décors années 20", "décors années 50", "décors années 80",
    "décors halloween", "décors Noël", "décors Saint-Valentin",
    "décors tropicaux", "décors western", "décors Vegas", "décors casino",
    
    // Mobilier
    "location mobilier mariage", "location tables rondes", "location chaises événement",
    "location nappes", "location housse chaise", "location lounge",
    "mobilier vintage Montréal", "mobilier rustique location",
    
    // Accessoires
    "accessoires décor mariage", "centres de table", "arche mariage",
    "backdrop événement", "toile de fond photo", "props photo booth",
    
    // Localisation
    "décors Rive-Sud", "location décors Québec", "décors région Montréal",
    "décors événementiels Longueuil", "location décors Boucherville",
    
    // Services
    "catalogue décors en ligne", "vente décors usagés", "liquidation décors",
    "décors à vendre Montréal", "mobilier événementiel occasion",
    
    // Professionnels
    "fournisseur décors événements", "grossiste décors", "décors professionnels",
    "décorateur événementiel", "planificateur mariage décors"
  ],
  authors: [{ name: "Spectre Entertainment" }],
  creator: "Spectre Entertainment",
  publisher: "Spectre Entertainment",
  metadataBase: new URL('https://spectre-entertainment.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: 'https://spectre-entertainment.com',
    siteName: 'Spectre Entertainment',
    title: "Catalogue de Décors Événementiels | Spectre Entertainment",
    description: "Plus de 1000 décors et mobilier pour tous types d'événements. Location et vente à Montréal et Longueuil. Mariages, galas, tournages, productions.",
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Spectre Entertainment - Location de décors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Catalogue de Décors Événementiels | Spectre Entertainment",
    description: "Plus de 1000 décors pour tous événements. Location et vente à Montréal.",
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Ajoutez vos codes de vérification ici
    google: 'votre-code-google',
    // yandex: 'votre-code-yandex',
    // bing: 'votre-code-bing',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA" data-theme="light">
      <head>
        {/* Preconnect to Google Fonts for theme fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload ALL theme fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Creepster&family=Pacifico&family=Fredoka+One&display=swap" rel="stylesheet" />
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
