import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { Document, ObjectId } from 'mongodb';
import type { JWT } from 'next-auth/jwt';

type DbUser = Document & {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role?: 'admin' | 'user';
  name?: string | null;
};

export const authOptions: any = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const client = await clientPromise;
        const db = client.db();
        const users = db.collection<DbUser>('users');
        const user = await users.findOne({ email: credentials.email.toLowerCase().trim() } as Partial<DbUser>);
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash || '');
        if (!ok) return null;
        return {
          id: String(user._id),
          email: user.email,
          role: user.role ?? 'user',
          name: user.name ?? undefined,
        } as { id: string; email: string; name?: string; role: 'admin' | 'user' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id: string; role?: 'admin' | 'user' } | null }) {
      if (user) {
        (token as JWT & { role?: 'admin' | 'user'; uid?: string }).role = user.role ?? 'user';
        (token as JWT & { role?: 'admin' | 'user'; uid?: string }).uid = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const t = token as JWT & { role?: 'admin' | 'user'; uid?: string };
      if (session.user) {
        session.user.role = t.role;
        session.user.id = t.uid;
      }
      return session as Session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};

// Export only options for NextAuth v4 usage

export async function getSession() {
  return (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
}

