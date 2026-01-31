import { nanoid } from "nanoid";

import { query, transaction } from "./postgres";

export type ChatConversation = {
  id: string;
  participantIds: string[];
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageStatus = "sent" | "delivered" | "read";
export type MessageType = "text" | "image" | "file" | "voice" | "location";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  status: MessageStatus;
  readAt?: string;
  messageType: MessageType;
  mediaUrl?: string;
  mediaType?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
};

function rowToConversation(row: any): ChatConversation {
  return {
    id: row.id,
    participantIds: row.participant_ids || [],
    lastMessageAt: row.last_message_at?.toISOString(),
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text || "",
    status: row.status || "sent",
    readAt: row.read_at?.toISOString(),
    messageType: row.message_type || "text",
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getOrCreateConversation(participantIds: string[]): Promise<ChatConversation> {
  const sorted = [...participantIds].sort();
  
  // Try to find existing conversation
  const existing = await query(`
    SELECT * FROM chat_conversations WHERE participant_ids = $1
  `, [sorted]);
  
  if (existing.rows.length > 0) {
    return rowToConversation(existing.rows[0]);
  }

  // Create new conversation
  const id = nanoid();
  const now = new Date();

  const result = await query(`
    INSERT INTO chat_conversations (id, participant_ids, created_at, updated_at)
    VALUES ($1, $2, $3, $3)
    RETURNING *
  `, [id, sorted, now]);

  return rowToConversation(result.rows[0]);
}

export async function getConversationById(id: string): Promise<ChatConversation | null> {
  const result = await query(`SELECT * FROM chat_conversations WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToConversation(result.rows[0]) : null;
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const result = await query(`
    SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC
  `, [conversationId]);
  return result.rows.map(rowToMessage);
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  text?: string;
  messageType?: MessageType;
  mediaUrl?: string;
  mediaType?: string;
  locationLat?: number;
  locationLng?: number;
}): Promise<ChatMessage> {
  return transaction(async (client) => {
    const id = nanoid();
    const now = new Date();

    const msgResult = await client.query(`
      INSERT INTO chat_messages (id, conversation_id, sender_id, text, status, message_type, media_url, media_type, location_lat, location_lng, created_at)
      VALUES ($1, $2, $3, $4, 'sent', $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [id, input.conversationId, input.senderId, input.text || "", input.messageType || "text", input.mediaUrl, input.mediaType, input.locationLat, input.locationLng, now]);

    // Update conversation last_message_at
    await client.query(`
      UPDATE chat_conversations SET last_message_at = $1, updated_at = $1 WHERE id = $2
    `, [now, input.conversationId]);

    return rowToMessage(msgResult.rows[0]);
  });
}

export async function markMessagesAsRead(conversationId: string, userId: string): Promise<number> {
  const now = new Date();
  const result = await query(`
    UPDATE chat_messages 
    SET status = 'read', read_at = $1 
    WHERE conversation_id = $2 AND sender_id != $3 AND status != 'read'
    RETURNING id
  `, [now, conversationId, userId]);
  return result.rowCount ?? 0;
}

export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) as count FROM chat_messages 
    WHERE conversation_id = $1 AND sender_id != $2 AND status != 'read'
  `, [conversationId, userId]);
  return parseInt(result.rows[0]?.count || "0", 10);
}

export async function getUserConversations(userId: string): Promise<ChatConversation[]> {
  const result = await query(`
    SELECT * FROM chat_conversations WHERE $1 = ANY(participant_ids) ORDER BY last_message_at DESC NULLS LAST
  `, [userId]);
  return result.rows.map(rowToConversation);
}

export async function getLastMessageForConversation(conversationId: string): Promise<ChatMessage | null> {
  const result = await query(`
    SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1
  `, [conversationId]);
  return result.rows.length > 0 ? rowToMessage(result.rows[0]) : null;
}

export async function deleteConversation(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM chat_conversations WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
