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
        const ok = await bcrypt.compare(credentials.password, (user as any).passwordHash || '');
        if (!ok) return null;
        return {
          id: String(user._id),
          email: user.email as string,
          role: (user as any).role || 'user',
          name: (user as any).name || undefined,
        } as any;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }: any) {
      const pathname = nextUrl?.pathname || '';
      const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
      if (!isAdminArea) return true;
      return Boolean(auth?.user) && ((auth.user as any).role === 'admin');
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'user';
        token.uid = (user as any).id;
      }
      return token as any;
    },
    async session({ session, token }) {
      (session.user as any).role = (token as any).role;
      (session.user as any).id = (token as any).uid;
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};

// Export only options for NextAuth v4 usage


