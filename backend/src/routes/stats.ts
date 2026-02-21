import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { files, downloads } from '../db/schema.js';
import { optionalAuth } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

const stats = new Hono<AppEnv>();

stats.get('/files/:id/stats', optionalAuth, async (c) => {
  const fileId = c.req.param('id');
  const userId = c.get('userId') as string | undefined;
  const sessionId = c.req.header('X-Session-Id');

  if (!userId && !sessionId) {
    return c.json({ error: 'Authentication or session ID required' }, 400);
  }

  // Fetch the file
  const file = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });

  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  // Verify ownership
  const isOwner =
    (userId && file.userId === userId) ||
    (sessionId && file.sessionId === sessionId);

  if (!isOwner) {
    return c.json({ error: 'Access denied' }, 403);
  }

  // Get download history
  const downloadHistory = await db
    .select({
      downloadedAt: downloads.downloadedAt,
    })
    .from(downloads)
    .where(eq(downloads.fileId, fileId))
    .orderBy(desc(downloads.downloadedAt));

  return c.json({
    fileId: file.id,
    filename: file.filename,
    downloadCount: file.downloadCount,
    downloads: downloadHistory.map((d) => ({
      downloadedAt: d.downloadedAt.toISOString(),
    })),
  });
});

export default stats;
