import { nanoid } from "nanoid";

import { query } from "./postgres";

export type RealtimeEngagementHealthLog = {
  id: string;
  userId: string;
  userLabel: string;
  mode: "idle" | "sse" | "fallback";
  subscribedBusinesses: number;
  reconnectAttempts: number;
  streamErrors: number;
  visible: boolean;
  source?: string;
  path?: string;
  createdAt: string;
};

type RealtimeEngagementHealthLogRow = {
  id: string;
  user_id: string;
  user_label: string;
  mode: "idle" | "sse" | "fallback";
  subscribed_businesses: number;
  reconnect_attempts: number;
  stream_errors: number;
  visible: boolean;
  source: string | null;
  path: string | null;
  created_at: Date | null;
};

function rowToLog(row: RealtimeEngagementHealthLogRow): RealtimeEngagementHealthLog {
  return {
    id: row.id,
    userId: row.user_id,
    userLabel: row.user_label,
    mode: row.mode,
    subscribedBusinesses: Number(row.subscribed_businesses ?? 0),
    reconnectAttempts: Number(row.reconnect_attempts ?? 0),
    streamErrors: Number(row.stream_errors ?? 0),
    visible: row.visible,
    source: row.source ?? undefined,
    path: row.path ?? undefined,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function logRealtimeEngagementHealthEvent(input: {
  userId: string;
  mode: "idle" | "sse" | "fallback";
  subscribedBusinesses: number;
  reconnectAttempts: number;
  streamErrors: number;
  visible: boolean;
  source?: string;
  path?: string;
}): Promise<void> {
  await query(
    `
    INSERT INTO realtime_engagement_health_logs (
      id,
      user_id,
      mode,
      subscribed_businesses,
      reconnect_attempts,
      stream_errors,
      visible,
      source,
      path,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      nanoid(),
      input.userId,
      input.mode,
      Math.max(0, input.subscribedBusinesses | 0),
      Math.max(0, input.reconnectAttempts | 0),
      Math.max(0, input.streamErrors | 0),
      input.visible,
      input.source ?? null,
      input.path ?? null,
      new Date(),
    ]
  );
}

export async function listRealtimeEngagementHealthLogs(options?: {
  limit?: number;
  mode?: "idle" | "sse" | "fallback";
  onlyErrors?: boolean;
  userId?: string;
  pathContains?: string;
}): Promise<RealtimeEngagementHealthLog[]> {
  const where: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (options?.mode) {
    where.push(`l.mode = $${idx++}`);
    values.push(options.mode);
  }

  if (options?.onlyErrors) {
    where.push(`l.stream_errors > 0`);
  }

  if (options?.userId) {
    where.push(`l.user_id = $${idx++}`);
    values.push(options.userId);
  }

  if (options?.pathContains) {
    where.push(`l.path ILIKE $${idx++}`);
    values.push(`%${options.pathContains}%`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.max(10, Math.min(options?.limit ?? 200, 1000));

  const result = await query<RealtimeEngagementHealthLogRow>(
    `
    SELECT
      l.id,
      l.user_id,
      COALESCE(u.display_name, u.full_name, u.email, l.user_id) AS user_label,
      l.mode,
      l.subscribed_businesses,
      l.reconnect_attempts,
      l.stream_errors,
      l.visible,
      l.source,
      l.path,
      l.created_at
    FROM realtime_engagement_health_logs l
    LEFT JOIN users u ON u.id = l.user_id
    ${whereSql}
    ORDER BY l.created_at DESC
    LIMIT ${limit}
    `,
    values
  );

  return result.rows.map(rowToLog);
}
