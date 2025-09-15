import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const handler = (NextAuth as unknown as (opts: any) => any)(authOptions);
export { handler as GET, handler as POST };


