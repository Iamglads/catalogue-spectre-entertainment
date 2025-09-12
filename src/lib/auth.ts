import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { Document } from 'mongodb';

export const authOptions: NextAuthOptions = {
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
        const users = db.collection<Document>('users');
        const user = await users.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, (user as Record<string, unknown>).passwordHash as string || '');
        if (!ok) return null;
        return {
          id: String(user._id),
          email: user.email as string,
          role: (user as Record<string, unknown>).role as string || 'user',
          name: (user as Record<string, unknown>).name as string || undefined,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: unknown; request: { nextUrl: { pathname: string } } }) {
      const pathname = nextUrl?.pathname || '';
      const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
      if (!isAdminArea) return true;
      return Boolean((auth as { user?: { role?: string } })?.user) && (((auth as { user: { role: string } }).user.role) === 'admin');
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || 'user';
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as { role?: string }).role = (token as { role?: string }).role;
      (session.user as { id?: string }).id = (token as { uid?: string }).uid;
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};

// Export only options for NextAuth v4 usage


