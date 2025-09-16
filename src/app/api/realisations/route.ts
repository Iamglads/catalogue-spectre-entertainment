import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

// Curated Cloudinary URLs provided by the client for the "RÉALISATIONS" section
const curatedRaw: string[] = [
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026770/spectre/catalogue/Anne%CC%81e_50_jyl53l.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026764/spectre/catalogue/Western_aa73if.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026760/spectre/catalogue/Barber_shop_ae9svb.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026754/spectre/catalogue/Barber_shop_zp3rdq.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026751/spectre/catalogue/Gatsby_ni1wkw.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026748/spectre/catalogue/Harry_Potter_khjk0r.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026743/spectre/catalogue/Hollywood_ilellh.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026740/spectre/catalogue/noel_de_glace_oo6mo6.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026728/spectre/catalogue/Soire%CC%81e_oscar_sddaa1.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026732/spectre/catalogue/Prohibition_bpbjvi.jpg',
  'https://res.cloudinary.com/dwisor9hx/image/upload/v1758026735/spectre/catalogue/Noel_traditionnel_cpg2xv.jpg',
];

function getBasename(url: string): string {
  const noQuery = url.split('?')[0];
  const idx = noQuery.lastIndexOf('/');
  return idx >= 0 ? noQuery.slice(idx + 1) : noQuery;
}

function logicalKey(url: string): string {
  const base = getBasename(url).toLowerCase();
  const withoutExt = base.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  const lastUnderscore = withoutExt.lastIndexOf('_');
  // Treat trailing random suffix after last underscore as non-essential for de-dup
  return lastUnderscore > 0 ? withoutExt.slice(0, lastUnderscore) : withoutExt;
}

// Remove duplicates by logical key (filename without extension and trailing suffix), keep first occurrence order
const curated: string[] = Array.from(new Map(curatedRaw.map((u) => [logicalKey(u), u])).values());

// Fetch images from the external "RÉALISATIONS" section and return a list of URLs
const getRealisationsCached = unstable_cache(
  async () => {
    // If curated list is present, use it directly
    if (curated.length > 0) {
      return { items: curated };
    }

    const url = 'https://spectre-entertainment.com/catalogue-decors/';
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // In case remote blocks HEAD/other methods
      method: 'GET',
    });
    if (!res.ok) return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
    const html = await res.text();

    // Isolate only the "RÉALISATIONS" section content
    let section = html;
    try {
      const startMatch = /R[ÉE]ALISATIONS/i.exec(html);
      if (startMatch) {
        const start = startMatch.index;
        const tail = html.slice(start);
        // End markers likely present after the section
        const endMarkers = [/INFOLETTRE/i, /A\s?PROPOS/i, /À\s?PROPOS/i, /NEWSLETTER/i];
        let end = tail.length;
        for (const m of endMarkers) {
          const mm = m.exec(tail);
          if (mm && mm.index < end) end = mm.index;
        }
        section = tail.slice(0, end);
      }
    } catch {}

    // Extract image URLs from uploads; keep https and jpg/png/webp
    const urls = new Set<string>();
    const regex = /(https?:\/\/[^\s"']+wp-content\/uploads[^"'>]+\.(?:jpg|jpeg|png|webp))/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(section))) {
      const src = match[1];
      if (src.includes('logo') || src.includes('icon')) continue;
      urls.add(src);
      if (urls.size > 120) break; // cap
    }

    const items = Array.from(urls).slice(0, 30);

    // Optional Cloudinary migration
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const secret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_FOLDER || 'spectre/realisations';
    let finalItems = items;
    if (apiKey && cloud && secret) {
      cloudinary.config({ cloud_name: cloud, api_key: apiKey, api_secret: secret });
      const uploaded: string[] = [];
      for (const src of items) {
        try {
          const r = await cloudinary.uploader.upload(src, { folder, overwrite: false, unique_filename: true, resource_type: 'image' });
          uploaded.push(r.secure_url);
        } catch {
          uploaded.push(src);
        }
      }
      finalItems = uploaded;
    }
    return { items: finalItems };
  },
  ['realisations-feed'],
  { revalidate: 3600, tags: ['realisations'] }
);


export async function GET() {
  try {
    const data = await getRealisationsCached();
    const resBody = NextResponse.json(data);
    resBody.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return resBody;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Unknown error' }, { status: 500 });
  }
}


