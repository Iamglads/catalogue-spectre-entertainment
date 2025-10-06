"use client";

import { NextSeo, ProductJsonLd } from "next-seo";

type Props = {
  title: string;
  description?: string;
  image?: string;
  canonical: string;
  keywords?: string[];
  brand?: string;
};

export default function ProductSeo({ title, description, image, canonical, keywords, brand }: Props) {
  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={canonical}
        additionalMetaTags={keywords && keywords.length ? [{ name: 'keywords', content: keywords.join(', ') }] : undefined}
        openGraph={{
          title,
          description,
          url: canonical,
          images: image ? [{ url: image, alt: title }] : undefined,
          type: 'product',
        }}
      />
      <ProductJsonLd
        productName={title}
        images={image ? [image] : []}
        description={description}
        brand={brand || 'Spectre'}
        offers={undefined}
      />
    </>
  );
}


