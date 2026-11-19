/**
 * Pure security rules for the admin (unit-tested; no I/O here).
 */

export const LOCKOUT = {
  /** Failed attempts per email inside the window before the account is temporarily locked. */
  maxFailuresPerEmail: 5,
  /** Failed attempts per IP inside the window (credential-stuffing guard). */
  maxFailuresPerIp: 30,
  windowMs: 15 * 60_000,
} as const;

export const SESSION = {
  /** Absolute session lifetime. */
  maxAgeSec: 12 * 60 * 60,
  /** Inactivity after which the session is rejected. */
  idleTimeoutMs: 2 * 60 * 60_000,
} as const;

export const TOKEN_TTL = {
  inviteMs: 48 * 60 * 60_000,
  resetMs: 2 * 60 * 60_000,
} as const;

export function isLockedOut(failures: { byEmail: number; byIp: number }): boolean {
  return (
    failures.byEmail >= LOCKOUT.maxFailuresPerEmail || failures.byIp >= LOCKOUT.maxFailuresPerIp
  );
}

export function isIdle(lastSeenMs: number | undefined, now = Date.now()): boolean {
  return lastSeenMs !== undefined && now - lastSeenMs > SESSION.idleTimeoutMs;
}

export type OwnerGuardInput = {
  /** Is the target user currently an active Owner? */
  targetIsActiveOwner: boolean;
  /** Number of active Owners in total (including the target). */
  activeOwnerCount: number;
  /** What the change does to the target. */
  change: "disable" | "demote" | "delete";
};

/**
 * "At least one Owner must always exist" (PLAN §6.3): blocks disabling, demoting or deleting the
 * last active Owner. Returns an error message, or null if the change is allowed.
 */
export function ownerGuard({
  targetIsActiveOwner,
  activeOwnerCount,
  change,
}: OwnerGuardInput): string | null {
  if (!targetIsActiveOwner) return null;
  if (activeOwnerCount <= 1) {
    const verb =
      change === "disable" ? "disable" : change === "demote" ? "change the role of" : "delete";
    return `You can't ${verb} the last active Owner. Make another user an Owner first.`;
  }
  return null;
}

/** Generic, enumeration-safe login error (same text for unknown email and wrong password). */
export const LOGIN_ERROR = "Incorrect email or password.";
export const LOCKED_ERROR = "Too many failed attempts. Please wait 15 minutes and try again.";
