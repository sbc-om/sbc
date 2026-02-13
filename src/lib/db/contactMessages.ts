import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";
import type { ContactMessage, Locale } from "./types";

const contactMessageSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  locale: z.enum(["en", "ar"]).default("en"),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: Locale;
  is_read: boolean | null;
  created_at: Date | null;
  read_at: Date | null;
};

function rowToContactMessage(r: ContactMessageRow): ContactMessage {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    locale: r.locale as Locale,
    isRead: r.is_read ?? false,
    createdAt: r.created_at?.toISOString() || new Date().toISOString(),
    readAt: r.read_at?.toISOString(),
  };
}

export async function createContactMessage(input: ContactMessageInput): Promise<ContactMessage> {
  const data = contactMessageSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const result = await query<ContactMessageRow>(`
    INSERT INTO contact_messages (id, name, email, subject, message, locale, is_read, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, false, $7)
    RETURNING *
  `, [id, data.name, data.email, data.subject, data.message, data.locale, now]);

  return rowToContactMessage(result.rows[0]);
}

export async function getContactMessageById(id: string): Promise<ContactMessage | null> {
  const result = await query<ContactMessageRow>(`SELECT * FROM contact_messages WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToContactMessage(result.rows[0]) : null;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const result = await query<ContactMessageRow>(`SELECT * FROM contact_messages ORDER BY created_at DESC`);
  return result.rows.map(rowToContactMessage);
}

export async function listUnreadContactMessages(): Promise<ContactMessage[]> {
  const result = await query<ContactMessageRow>(`SELECT * FROM contact_messages WHERE is_read = false ORDER BY created_at DESC`);
  return result.rows.map(rowToContactMessage);
}

export async function markContactMessageAsRead(id: string): Promise<ContactMessage> {
  const result = await query<ContactMessageRow>(`
    UPDATE contact_messages SET is_read = true, read_at = $1 WHERE id = $2 RETURNING *
  `, [new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToContactMessage(result.rows[0]);
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM contact_messages WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getUnreadCount(): Promise<number> {
  const result = await query(`SELECT COUNT(*) FROM contact_messages WHERE is_read = false`);
  return parseInt(result.rows[0].count);
}
