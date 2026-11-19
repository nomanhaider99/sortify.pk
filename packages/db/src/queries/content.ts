import { db as sharedDb, type Database } from "../client";
import { contactMessages } from "../schema";

/** Stores a contact-form submission (status `unread`, visible in the admin Messages inbox). */
export async function createContactMessage(
  input: {
    name: string;
    email: string;
    phone?: string | undefined;
    subject: string;
    message: string;
  },
  db: Database = sharedDb,
): Promise<string | null> {
  const [row] = await db
    .insert(contactMessages)
    .values({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      message: input.message,
    })
    .returning({ id: contactMessages.id });
  return row?.id ?? null;
}
