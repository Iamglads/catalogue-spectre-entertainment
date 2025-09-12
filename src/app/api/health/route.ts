import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') console.log('[api/health] starting', { hasMongoUri: Boolean(process.env.MONGODB_URI) });
    const client = await clientPromise;
    await client.db().admin().ping();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[api/health] error', error);
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}
