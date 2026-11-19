import { TOKEN_TTL } from "@repo/shared";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db as sharedDb, type Database } from "../client";
import { adminUsers, invites, passwordResetTokens } from "../schema";

export type TokenKind = "invite" | "reset";

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** Creates a one-time token and returns the RAW value (only its SHA-256 hash is stored). */
export async function createAccountToken(
  kind: TokenKind,
  userId: string,
  createdBy: string | null,
  db: Database = sharedDb,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + (kind === "invite" ? TOKEN_TTL.inviteMs : TOKEN_TTL.resetMs),
  );
  if (kind === "invite") {
    // Only the newest invite stays valid.
    await db
      .update(invites)
      .set({ usedAt: new Date() })
      .where(and(eq(invites.userId, userId), isNull(invites.usedAt)));
    await db.insert(invites).values({ userId, tokenHash, expiresAt, createdBy });
  } else {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
    await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
  }
  return { token, expiresAt };
}

/** Looks up a valid (unused, unexpired) token without consuming it. */
export async function peekAccountToken(kind: TokenKind, raw: string, db: Database = sharedDb) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(raw)) return null;
  const table = kind === "invite" ? invites : passwordResetTokens;
  const [row] = await db
    .select({ userId: table.userId, email: adminUsers.email, name: adminUsers.name })
    .from(table)
    .innerJoin(adminUsers, eq(adminUsers.id, table.userId))
    .where(
      and(
        eq(table.tokenHash, hashToken(raw)),
        isNull(table.usedAt),
        gt(table.expiresAt, new Date()),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Consumes a token and sets the user's password in one transaction. Bumps `session_version` so any
 * existing sessions are signed out. Returns the user id, or null if the token is invalid.
 */
export async function consumeTokenAndSetPassword(
  kind: TokenKind,
  raw: string,
  passwordHash: string,
  db: Database = sharedDb,
): Promise<string | null> {
  const table = kind === "invite" ? invites : passwordResetTokens;
  return db.transaction(async (tx) => {
    const [used] = await tx
      .update(table)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(table.tokenHash, hashToken(raw)),
          isNull(table.usedAt),
          gt(table.expiresAt, new Date()),
        ),
      )
      .returning({ userId: table.userId });
    if (!used) return null;
    await tx
      .update(adminUsers)
      .set({
        passwordHash,
        mustChangePassword: false,
        sessionVersion: sql`${adminUsers.sessionVersion} + 1`,
      })
      .where(eq(adminUsers.id, used.userId));
    return used.userId;
  });
}
