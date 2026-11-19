import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db as sharedDb, type Database, type Transaction } from "../client";
import { adminUsers, auditLogs } from "../schema";

export type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  diff?: Record<string, { before: unknown; after: unknown }> | null;
  ip?: string | null;
  userAgent?: string | null;
};

const IP_RE = /^[0-9a-fA-F:.]{2,45}$/;

/** Appends an audit log entry (who, what, entity, before/after, IP, user agent). */
export async function writeAuditLog(entry: AuditEntry, db: Database | Transaction = sharedDb) {
  await db.insert(auditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary.slice(0, 500),
    diff: entry.diff ?? null,
    ip: entry.ip && IP_RE.test(entry.ip) ? entry.ip : null,
    userAgent: entry.userAgent?.slice(0, 300) ?? null,
  });
}

export async function listAuditLogs(
  filters: {
    q?: string;
    entityType?: string;
    actorId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  },
  db: Database = sharedDb,
) {
  const where: (SQL | undefined)[] = [];
  if (filters.entityType) where.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.actorId) where.push(eq(auditLogs.actorId, filters.actorId));
  if (filters.from) where.push(gte(auditLogs.createdAt, filters.from));
  if (filters.to) where.push(lte(auditLogs.createdAt, filters.to));
  if (filters.q) {
    const like = `%${filters.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    where.push(
      or(
        ilike(auditLogs.summary, like),
        ilike(auditLogs.action, like),
        ilike(auditLogs.entityId, like),
      ),
    );
  }
  const cond = where.length ? and(...where) : undefined;
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        summary: auditLogs.summary,
        diff: auditLogs.diff,
        ip: auditLogs.ip,
        createdAt: auditLogs.createdAt,
        actorName: adminUsers.name,
        actorEmail: adminUsers.email,
      })
      .from(auditLogs)
      .leftJoin(adminUsers, eq(adminUsers.id, auditLogs.actorId))
      .where(cond)
      .orderBy(desc(auditLogs.createdAt))
      .limit(Math.min(filters.limit ?? 50, 200))
      .offset(filters.offset ?? 0),
    db.select({ n: count() }).from(auditLogs).where(cond),
  ]);
  return { rows, total: total?.n ?? 0 };
}
