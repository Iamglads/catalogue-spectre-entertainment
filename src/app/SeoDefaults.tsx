"use client";

import { DefaultSeo, LocalBusinessJsonLd, OrganizationJsonLd } from "next-seo";
import Script from "next/script";

export default function SeoDefaults() {
  // Schéma JSON-LD enrichi pour l'organisation
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://spectre-entertainment.com/#organization",
    "name": "Spectre Entertainment",
    "legalName": "Spectre Entertainment",
    "url": "https://spectre-entertainment.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://spectre-entertainment.com/logo.png",
      "width": "400",
      "height": "400"
    },
    "image": "https://spectre-entertainment.com/logo.png",
    "description": "Spécialiste de la location et vente de décors événementiels à Montréal et Longueuil. Plus de 1000 décors pour mariages, galas, tournages et productions.",
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
    "sameAs": [
      "https://www.facebook.com/spectre.entertainment"
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Montréal"
      },
      {
        "@type": "City",
        "name": "Longueuil"
      },
      {
        "@type": "State",
        "name": "Québec"
      }
    ],
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "17:00"
      }
    ]
  };

  // Schéma pour le service de location
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://spectre-entertainment.com/#service",
    "serviceType": "Location de décors événementiels",
    "name": "Location de Décors et Mobilier Événementiel",
    "description": "Location complète de décors, mobilier et accessoires pour tous types d'événements: mariages, galas, tournages, productions TV et cinéma.",
    "provider": {
      "@id": "https://spectre-entertainment.com/#organization"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Montréal"
      },
      {
        "@type": "City",
        "name": "Longueuil"
      },
      {
        "@type": "State",
        "name": "Québec"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Catalogue de Décors",
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
  };

  // Schéma BreadcrumbList pour la navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://spectre-entertainment.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Catalogue",
        "item": "https://spectre-entertainment.com/"
      }
    ]
  };

  // Schéma WebSite avec SearchAction
  const websiteSchema = {
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
  };

  return (
    <>
      <DefaultSeo
        titleTemplate="%s | Spectre Entertainment"
        defaultTitle="Catalogue de Décors Événementiels | Spectre Entertainment"
        description="Plus de 1000 décors et mobilier pour tous types d'événements. Location et vente à Montréal et Longueuil. Mariages, galas, tournages, productions TV et cinéma."
        openGraph={{ 
          type: 'website', 
          locale: 'fr_CA', 
          siteName: 'Spectre Entertainment',
          images: [
            {
              url: 'https://spectre-entertainment.com/logo.png',
              width: 1200,
              height: 630,
              alt: 'Spectre Entertainment - Location de décors',
            }
          ]
        }}
        additionalMetaTags={[
          { 
            name: 'keywords', 
            content: 'location décors Montréal, location décors Longueuil, décors mariage, décors gala, décors tournage, location mobilier événementiel, décors thématiques, décors vintage, décors production TV' 
          },
          {
            name: 'geo.region',
            content: 'CA-QC'
          },
          {
            name: 'geo.placename',
            content: 'Longueuil'
          },
          {
            name: 'geo.position',
            content: '45.5873;-73.4709'
          },
          {
            name: 'ICBM',
            content: '45.5873, -73.4709'
          }
        ]}
      />
      
      {/* Schémas JSON-LD */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Schemas next-seo (pour compatibilité) */}
      <OrganizationJsonLd
        type="Organization"
        id="https://spectre-entertainment.com/#organization"
        legalName="Spectre Entertainment"
        name="Spectre Entertainment"
        url="https://spectre-entertainment.com/"
        logo="https://spectre-entertainment.com/logo.png"
        sameAs={["https://www.facebook.com/spectre.entertainment"]}
      />
      <LocalBusinessJsonLd
        type="Store"
        id="https://spectre-entertainment.com/#localbusiness"
        name="Spectre Entertainment"
        description="Location et vente de décors événementiels à Longueuil / Montréal. Plus de 1000 décors disponibles pour mariages, galas, tournages et productions."
        url="https://spectre-entertainment.com/"
        telephone="+1-450-332-0894"
        address={{ 
          streetAddress: '940 Jean‑Neveu', 
          addressLocality: 'Longueuil', 
          addressRegion: 'QC', 
          postalCode: 'J4G 2M1', 
          addressCountry: 'CA' 
        }}
        geo={{ latitude: 45.5873, longitude: -73.4709 }}
        images={['https://spectre-entertainment.com/logo.png']}
        openingHours={[
          {
            opens: '09:00',
            closes: '17:00',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        ]}
      />
    </>
  );
}












