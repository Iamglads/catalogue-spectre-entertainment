import { withAuth } from 'next-auth/middleware';
import type { NextRequest } from 'next/server';

export default withAuth({
  pages: { signIn: '/admin/login' },
  callbacks: {
    authorized: ({ token, req }: { token: { role?: 'admin' | 'user' } | null; req: NextRequest }) => {
      const pathname = req.nextUrl.pathname;
      // Allow auth routes and the custom sign-in page
      if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin/login')) {
        return true;
      }
      // Allow invite acceptance (public)
      if (pathname.startsWith('/admin/invite/')) return true;
      if (pathname.startsWith('/api/admin/invites/accept')) return true;
      const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
      if (!isAdminArea) return true;
      // Allow both admin and user to access admin area; further checks per-route
      return Boolean(token) && (token?.role === 'admin' || token?.role === 'user');
    },
  },
});

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };


