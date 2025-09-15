import clientPromise from '@/lib/mongodb';

export type AuditEvent = {
  userId?: string | null;
  email?: string | null;
  action: string; // e.g., product.create, product.update, product.delete
  resource?: { type: string; id?: string | null };
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const audits = db.collection<AuditEvent>('audits');
    await audits.insertOne({ ...event, createdAt: new Date() });
  } catch {}
}


