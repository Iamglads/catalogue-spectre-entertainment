import { NextResponse } from 'next/server';

// Fetch images from the external "RÉALISATIONS" section and return a list of URLs
export async function GET() {
  try {
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
    const resBody = NextResponse.json({ items });
    resBody.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return resBody;
  } catch (e: unknown) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


