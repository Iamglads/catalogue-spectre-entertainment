import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import type { Document } from 'mongodb';
import { inviteEmail } from '@/lib/emailTemplates';

function genToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { email, name } = (await req.json()) as { email: string; name?: string };
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  const invites = db.collection<Document>('invites');
  const users = db.collection<Document>('users');
  const normalized = email.toLowerCase().trim();
  // Duplicate checks
  const existsUser = await users.findOne({ email: normalized });
  if (existsUser) return NextResponse.json({ error: 'Cet utilisateur existe déjà' }, { status: 400 });
  const existingInvite = await invites.findOne({ email: normalized, status: 'pending', expiresAt: { $gt: new Date() } });
  if (existingInvite) return NextResponse.json({ error: 'Une invitation est déjà en attente pour cet email' }, { status: 400 });
  const token = genToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  await invites.insertOne({ email: normalized, name: name || '', token, role: 'user', status: 'pending', createdAt: new Date(), expiresAt });
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/invite/${token}`;
  // Send via Brevo
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@spectre-entertainment.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Catalogue';
  if (apiKey) {
    const htmlContent = inviteEmail({ toName: name, inviteUrl: url });
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({ sender: { email: senderEmail, name: senderName }, to: [{ email: normalized, name }], subject: 'Invitation à rejoindre le catalogue', htmlContent }),
    });
  }
  return NextResponse.json({ token, url });
}


