import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_common";

export const roles = pgTable(
  "roles",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    isSystem: boolean("is_system").notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("roles_name_uq").on(sql`lower(${t.name})`)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permission] })],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** Null until an invited user sets a password. */
    passwordHash: text("password_hash"),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    /** Bumped to invalidate every existing session ("sign out everywhere" / force logout). */
    sessionVersion: integer("session_version").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    invitedBy: uuid("invited_by").references((): AnyPgColumn => adminUsers.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("admin_users_email_uq").on(sql`lower(${t.email})`),
    index("admin_users_role_idx").on(t.roleId),
    index("admin_users_invited_by_idx").on(t.invitedBy),
  ],
);

/** One-time invite / set-password links. Only a SHA-256 hash of the token is stored. */
export const invites = pgTable(
  "invites",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invites_token_hash_uq").on(t.tokenHash),
    index("invites_user_idx").on(t.userId),
    index("invites_created_by_idx").on(t.createdBy),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("password_reset_tokens_hash_uq").on(t.tokenHash),
    index("password_reset_tokens_user_idx").on(t.userId),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull().default(""),
    diff: jsonb("diff").$type<Record<string, { before: unknown; after: unknown }>>(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

/** Login attempts for rate limiting / temporary lockout per IP and email. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: id(),
    email: text("email").notNull(),
    ip: inet("ip"),
    success: boolean("success").notNull(),
    reason: text("reason"),
    ...timestamps,
  },
  (t) => [
    index("login_attempts_email_idx").on(sql`lower(${t.email})`, t.createdAt),
    index("login_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
);
