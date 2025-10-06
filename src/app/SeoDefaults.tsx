"use client";

import { DefaultSeo, LocalBusinessJsonLd, OrganizationJsonLd } from "next-seo";

export default function SeoDefaults() {
  return (
    <>
      <DefaultSeo
        titleTemplate="%s | Spectre Entertainment"
        defaultTitle="Catalogue des décors | Spectre Entertainment"
        description="Catalogue de décors événementiels. Location et vente à Longueuil / Montréal."
        openGraph={{ type: 'website', locale: 'fr_CA', siteName: 'Spectre Entertainment' }}
        additionalMetaTags={[{ name: 'keywords', content: 'décors, location, événementiel, Montréal, Longueuil, cinéma, tournage, spectacle' }]}
      />
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
        type="EventVenue"
        id="https://spectre-entertainment.com/#localbusiness"
        name="Spectre Entertainment"
        description="Location et vente de décors événementiels à Longueuil / Montréal."
        url="https://spectre-entertainment.com/"
        telephone="+1-450-332-8700"
        address={{ streetAddress: '940 Jean‑Neveu', addressLocality: 'Longueuil', addressRegion: 'QC', postalCode: 'J4G 2M1', addressCountry: 'CA' }}
        geo={{ latitude: 45.5873, longitude: -73.4709 }}
      />
    </>
  );
}


