import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId, type Document } from 'mongodb';

export async function POST(req: NextRequest) {
  const { token, email, name, password } = (await req.json()) as { token?: string; email?: string; name?: string; password?: string };
  if (!token || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  type InviteDoc = Document & { _id: ObjectId; name?: string; token: string; status: 'pending' | 'accepted' | 'revoked'; expiresAt: Date };
  type UserDoc = Document & { _id: ObjectId; email: string; passwordHash: string; role: 'user' | 'admin'; name?: string; createdAt: Date; updatedAt: Date };
  const invites = db.collection<InviteDoc>('invites');
  const users = db.collection<UserDoc>('users');
  const inv = await invites.findOne({ token, status: 'pending', expiresAt: { $gt: new Date() } });
  if (!inv) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  const existing = await users.findOne({ email: email.toLowerCase().trim() });
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: Omit<UserDoc, '_id'> = {
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'user',
    name: name || inv.name || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const res = await users.insertOne(newUser as unknown as UserDoc);
  await invites.updateOne({ _id: inv._id }, { $set: { status: 'accepted', acceptedAt: new Date(), userId: res.insertedId } });
  return NextResponse.json({ ok: true });
}


