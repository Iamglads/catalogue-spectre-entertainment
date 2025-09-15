import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import type { Document } from 'mongodb';

export async function GET(req: NextRequest) {
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const usersCol = db.collection<Document>('users');
  const rows = await usersCol.find({}, { projection: { email: 1, role: 1, name: 1, createdAt: 1 } }).sort({ createdAt: -1, _id: -1 }).toArray();
  return NextResponse.json({ items: rows.map((u) => ({ _id: String(u._id), email: u.email, role: u.role || 'user', name: u.name || '' })) });
}


