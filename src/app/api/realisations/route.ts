import { NextResponse } from 'next/server';

// Fetch images from the external "RÉALISATIONS" section and return a list of URLs
export async function GET() {
  try {
    const url = 'https://spectre-entertainment.com/catalogue-decors/';
    const res = await fetch(url, { cache: 'no-store' });
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

    return NextResponse.json({ items: Array.from(urls) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


