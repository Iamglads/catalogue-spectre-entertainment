import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import type { Document } from 'mongodb';

export async function GET(req: NextRequest) {
  const session = (await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions));
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || (user.role !== 'admin' && user.role !== 'user')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get('resourceId');
  const client = await clientPromise;
  const db = client.db();
  const audits = db.collection<Document>('audits');
  const query: Document = {};
  if (resourceId) query['resource.id'] = resourceId;
  const rows = await audits.find(query).sort({ createdAt: -1, _id: -1 }).limit(200).toArray();
  return NextResponse.json({ items: rows.map((d) => ({ ...d, _id: String(d._id) })) });
}


