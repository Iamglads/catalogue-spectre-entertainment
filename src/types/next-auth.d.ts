declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: 'admin' | 'user';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    role?: 'admin' | 'user';
  }
}


