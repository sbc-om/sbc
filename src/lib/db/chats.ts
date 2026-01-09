import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";

export type ChatConversation = {
  id: string;
  userId: string;
  businessId: string;
  businessSlug: string;
  updatedAt: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: "user";
  text: string;
  createdAt: string;
};

const userIdSchema = z.string().trim().min(1);
const businessIdSchema = z.string().trim().min(1);
const businessSlugSchema = z.string().trim().min(1);
const textSchema = z.string().trim().min(1).max(2000);

function convKey(userId: string, businessId: string) {
  return `${userIdSchema.parse(userId)}:${businessIdSchema.parse(businessId)}`;
}

export function getOrCreateConversation(input: {
  userId: string;
  businessId: string;
  businessSlug: string;
}): ChatConversation {
  const { chatConversations } = getLmdb();
  const id = convKey(input.userId, input.businessId);
  const existing = chatConversations.get(id) as ChatConversation | undefined;
  if (existing) return existing;

  const now = new Date().toISOString();
  const conv: ChatConversation = {
    id,
    userId: userIdSchema.parse(input.userId),
    businessId: businessIdSchema.parse(input.businessId),
    businessSlug: businessSlugSchema.parse(input.businessSlug),
    createdAt: now,
    updatedAt: now,
  };
  chatConversations.put(id, conv);
  return conv;
}

export function listConversationsByUser(userId: string): ChatConversation[] {
  const { chatConversations } = getLmdb();
  const uid = userIdSchema.parse(userId);

  const results: ChatConversation[] = [];
  for (const { value } of chatConversations.getRange()) {
    const c = value as ChatConversation;
    if (c.userId === uid) results.push(c);
  }
  results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return results;
}

export function listMessages(conversationId: string): ChatMessage[] {
  const { chatMessages } = getLmdb();
  const value = chatMessages.get(conversationId) as ChatMessage[] | undefined;
  if (!Array.isArray(value)) return [];
  return value;
}

export function sendUserMessage(input: {
  userId: string;
  businessId: string;
  businessSlug: string;
  text: string;
}): ChatMessage {
  const { chatMessages, chatConversations } = getLmdb();

  const conv = getOrCreateConversation({
    userId: input.userId,
    businessId: input.businessId,
    businessSlug: input.businessSlug,
  });

  const msg: ChatMessage = {
    id: nanoid(),
    conversationId: conv.id,
    sender: "user",
    text: textSchema.parse(input.text),
    createdAt: new Date().toISOString(),
  };

  const current = listMessages(conv.id);
  const next = [...current, msg].slice(-300); // keep last 300 msgs per conversation
  chatMessages.put(conv.id, next);

  chatConversations.put(conv.id, {
    ...conv,
    updatedAt: msg.createdAt,
  });

  return msg;
}
