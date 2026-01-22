import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { ContactMessage } from "./types";

const idSchema = z.string().trim().min(1);
const contactMessageInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(320),
    subject: z.string().trim().min(2).max(200),
    message: z.string().trim().min(10).max(4000),
    locale: z.enum(["en", "ar"]),
  })
  .strict();

export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>;

export function createContactMessage(input: ContactMessageInput): ContactMessage {
  const { contactMessages } = getLmdb();
  const data = contactMessageInputSchema.parse(input);
  const now = new Date().toISOString();

  const msg: ContactMessage = {
    id: nanoid(12),
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    locale: data.locale,
    isRead: false,
    createdAt: now,
  };

  contactMessages.put(msg.id, msg);
  return msg;
}

export function getContactMessageById(messageId: string): ContactMessage | null {
  const { contactMessages } = getLmdb();
  const id = idSchema.safeParse(messageId);
  if (!id.success) return null;
  return (contactMessages.get(id.data) as ContactMessage | undefined) ?? null;
}

export function listContactMessages(): ContactMessage[] {
  const { contactMessages } = getLmdb();
  const results: ContactMessage[] = [];

  for (const { value } of contactMessages.getRange({ reverse: true })) {
    results.push(value as ContactMessage);
  }

  return results;
}

export function countUnreadContactMessages(): number {
  const { contactMessages } = getLmdb();
  let count = 0;
  for (const { value } of contactMessages.getRange()) {
    const msg = value as ContactMessage;
    if (!msg.isRead) count += 1;
  }
  return count;
}

export function setContactMessageRead(input: {
  messageId: string;
  isRead: boolean;
}): ContactMessage {
  const { contactMessages } = getLmdb();
  const messageId = idSchema.parse(input.messageId);

  const existing = contactMessages.get(messageId) as ContactMessage | undefined;
  if (!existing) throw new Error("MESSAGE_NOT_FOUND");

  const next: ContactMessage = {
    ...existing,
    isRead: input.isRead,
    readAt: input.isRead ? new Date().toISOString() : undefined,
  };

  contactMessages.put(messageId, next);
  return next;
}
