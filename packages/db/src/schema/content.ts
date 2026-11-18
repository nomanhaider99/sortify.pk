import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, uniqueIndex, uuid, timestamp } from "drizzle-orm/pg-core";
import { adminUsers } from "./admin";
import { id, messageStatusEnum, timestamps } from "./_common";

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: messageStatusEnum("status").notNull().default("unread"),
    handledBy: uuid("handled_by").references(() => adminUsers.id, { onDelete: "set null" }),
    handledAt: timestamp("handled_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("contact_messages_status_idx").on(t.status, t.createdAt),
    index("contact_messages_handled_by_idx").on(t.handledBy),
    index("contact_messages_email_idx").on(sql`lower(${t.email})`),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: id(),
    email: text("email").notNull(),
    source: text("source").notNull().default("footer"),
    ...timestamps,
  },
  (t) => [uniqueIndex("newsletter_subscribers_email_uq").on(sql`lower(${t.email})`)],
);

/** Key/value store-wide settings; values are validated with `settingsSchemas` from @repo/shared. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
});
