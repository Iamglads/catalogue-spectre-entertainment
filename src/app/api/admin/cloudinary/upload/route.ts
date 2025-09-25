import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import { isCloudinaryEnabled, uploadImageFromUrlOrData } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isCloudinaryEnabled()) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const files = form.getAll('files');
    if (!files.length) {
      return NextResponse.json({ items: [] });
    }
    const uploads: Array<{ url: string; publicId: string } | null> = [];
    for (const f of files) {
      if (typeof f === 'string') continue;
      const file = f as File;
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;
      const res = await uploadImageFromUrlOrData(dataUrl).catch(() => null);
      uploads.push(res);
    }
    const items = uploads.filter(Boolean) as Array<{ url: string; publicId: string }>;
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


