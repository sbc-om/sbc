import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check
 *     description: Returns application health status including database connectivity
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 database:
 *                   type: string
 *                   enum: [connected, disconnected]
 *       503:
 *         description: Application is unhealthy
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    await query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    // Database is down — report unhealthy
  }

  const healthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      ok: healthy,
      status: healthy ? 'healthy' : 'degraded',
      timestamp,
      uptime: process.uptime(),
      database: dbStatus,
    },
    { status: healthy ? 200 : 503 },
  );
}
