import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import bcrypt from 'bcryptjs';

async function main() {
  const { default: clientPromise } = await import('@/lib/mongodb');
  const email = process.env.SEED_ADMIN_EMAIL as string;
  const password = process.env.SEED_ADMIN_PASSWORD as string;
  if (!email || !password) {
    console.error('Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD');
    process.exit(1);
  }
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection('users');
  const exists = await users.findOne({ email: email.toLowerCase() });
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await users.insertOne({ email: email.toLowerCase(), role: 'admin', passwordHash, createdAt: new Date() });
  console.log('Admin created:', email);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


