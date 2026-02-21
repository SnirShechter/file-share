import { Hono } from 'hono';
import { eq, or, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { files } from '../db/schema.js';
import { optionalAuth } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

const fileRoutes = new Hono<AppEnv>();

fileRoutes.get('/files', optionalAuth, async (c) => {
  const userId = c.get('userId') as string | undefined;
  const sessionId = c.req.header('X-Session-Id');

  if (!userId && !sessionId) {
    return c.json({ error: 'Authentication or session ID required' }, 400);
  }

  const conditions = [];
  if (userId) {
    conditions.push(eq(files.userId, userId));
  }
  if (sessionId) {
    conditions.push(eq(files.sessionId, sessionId));
  }

  const userFiles = await db
    .select()
    .from(files)
    .where(or(...conditions))
    .orderBy(desc(files.uploadedAt));

  return c.json({
    files: userFiles.map((f) => ({
      id: f.id,
      code: f.code,
      filename: f.filename,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      uploadedAt: f.uploadedAt?.toISOString(),
      expiresAt: f.expiresAt.toISOString(),
      downloadCount: f.downloadCount,
    })),
  });
});

export default fileRoutes;
