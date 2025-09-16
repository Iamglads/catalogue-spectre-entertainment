import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Partial<{ role: 'admin' | 'user'; name: string }>;
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<Document>('users');
  const update: Document = {};
  if (body.role) update.role = body.role;
  if (typeof body.name === 'string') update.name = body.name;
  await users.updateOne({ _id: new ObjectId(id) }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<Document>('users');
  const totalUsers = await users.countDocuments({});
  if (totalUsers <= 1) return NextResponse.json({ error: 'Cannot remove the last user' }, { status: 400 });
  const target = await users.findOne({ _id: new ObjectId(id) });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if ((target.role || 'user') === 'admin') {
    const otherAdmins = await users.countDocuments({ _id: { $ne: (target as any)._id }, role: 'admin' });
    if (otherAdmins === 0) return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
  }
  await users.deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}


