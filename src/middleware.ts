import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/admin/login' },
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;
      // Allow auth routes and the custom sign-in page
      if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin/login')) {
        return true;
      }
      const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
      if (!isAdmin) return true;
      return Boolean(token) && (token as any).role === 'admin';
    },
  },
});

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };


