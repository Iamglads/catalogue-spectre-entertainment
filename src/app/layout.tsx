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
        
        {/* Schema.org JSON-LD pour SEO - Organization & LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Organization", "LocalBusiness", "Store"],
              "@id": "https://spectre-entertainment.com/#organization",
              "name": "Spectre Entertainment",
              "legalName": "Spectre Entertainment",
              "alternateName": "Spectre Décors Événementiels",
              "url": "https://spectre-entertainment.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://spectre-entertainment.com/logo.png",
                "width": "400",
                "height": "400"
              },
              "image": "https://spectre-entertainment.com/logo.png",
              "description": "Spécialiste de la location et vente de décors événementiels au Québec. Plus de 1000 décors pour mariages, galas, tournages, productions TV et cinéma.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "940 Jean‑Neveu",
                "addressLocality": "Longueuil",
                "addressRegion": "QC",
                "postalCode": "J4G 2M1",
                "addressCountry": "CA"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "45.5873",
                "longitude": "-73.4709"
              },
              "telephone": "+1-450-332-0894",
              "email": "info@spectre-entertainment.com",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-450-332-0894",
                "contactType": "customer service",
                "areaServed": "CA-QC",
                "availableLanguage": ["French", "English"]
              },
              "sameAs": [
                "https://www.facebook.com/spectre.entertainment"
              ],
              "areaServed": [
                { "@type": "City", "name": "Montréal", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "City", "name": "Longueuil", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "City", "name": "Laval", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "City", "name": "Québec", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "City", "name": "Gatineau", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "City", "name": "Sherbrooke", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "City", "name": "Trois-Rivières", "addressRegion": "QC", "addressCountry": "CA" },
                { "@type": "State", "name": "Québec", "addressCountry": "CA" }
              ],
              "priceRange": "$$",
              "paymentAccepted": "Cash, Credit Card, Debit Card, Bank Transfer",
              "currenciesAccepted": "CAD",
              "openingHoursSpecification": [{
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              }],
              "slogan": "Plus de 1000 décors pour tous vos événements"
            })
          }}
        />
        
        {/* Schema.org JSON-LD - Service */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "@id": "https://spectre-entertainment.com/#service",
              "serviceType": "Location de décors événementiels",
              "name": "Location et Vente de Décors Événementiels",
              "description": "Location complète de décors, mobilier et accessoires pour tous types d'événements au Québec: mariages, galas, tournages, productions TV et cinéma.",
              "provider": {
                "@id": "https://spectre-entertainment.com/#organization"
              },
              "areaServed": {
                "@type": "State",
                "name": "Québec",
                "addressCountry": "CA"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Catalogue de Décors et Mobilier",
                "itemListElement": [
                  {
                    "@type": "OfferCatalog",
                    "name": "Décors de Mariage",
                    "description": "Décors complets pour mariages: arches, centres de table, backdrop, mobilier"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Décors de Gala",
                    "description": "Décors élégants pour galas et événements corporatifs"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Décors de Production",
                    "description": "Décors professionnels pour tournages TV, cinéma et productions"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Décors Thématiques",
                    "description": "Large sélection de décors thématiques: vintage, rustique, Halloween, Noël, tropical"
                  },
                  {
                    "@type": "OfferCatalog",
                    "name": "Mobilier Événementiel",
                    "description": "Location de mobilier: tables, chaises, lounge, nappes, housses"
                  }
                ]
              }
            })
          }}
        />
        
        {/* Schema.org JSON-LD - WebSite avec SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://spectre-entertainment.com/#website",
              "url": "https://spectre-entertainment.com",
              "name": "Spectre Entertainment - Catalogue de Décors",
              "description": "Catalogue complet de location et vente de décors événementiels",
              "publisher": {
                "@id": "https://spectre-entertainment.com/#organization"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://spectre-entertainment.com/?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              },
              "inLanguage": "fr-CA"
            })
          }}
        />
        
        {/* Schema.org JSON-LD - BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Accueil",
                  "item": "https://spectre-entertainment.com"
                }
              ]
            })
          }}
        />
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
