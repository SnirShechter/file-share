import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { files, downloads } from '../db/schema.js';
import * as storage from '../services/file-storage.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { notifyOwner, getOwnerKey } from '../services/websocket.js';
import { sql } from 'drizzle-orm';

const download = new Hono();

// GET /api/download/:code - Get file metadata
download.get('/download/:code', async (c) => {
  const code = c.req.param('code');

  const file = await db.query.files.findFirst({
    where: and(
      eq(files.code, code),
      gt(files.expiresAt, new Date())
    ),
  });

  if (!file) {
    return c.json({ error: 'File not found or expired' }, 404);
  }

  return c.json({
    filename: file.filename,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
  });
});

// POST /api/download/:code - Download the file
download.post('/download/:code', rateLimit, async (c) => {
  const code = c.req.param('code');

  const file = await db.query.files.findFirst({
    where: and(
      eq(files.code, code),
      gt(files.expiresAt, new Date())
    ),
  });

  if (!file) {
    return c.json({ error: 'File not found or expired' }, 404);
  }

  // Increment download count
  await db.update(files)
    .set({ downloadCount: sql`${files.downloadCount} + 1` })
    .where(eq(files.id, file.id));

  // Record download event
  const clientIp = c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') || null;

  await db.insert(downloads).values({
    fileId: file.id,
    ipAddress: clientIp,
  });

  // Notify file owner via WebSocket
  const ownerKey = getOwnerKey(file.userId, file.sessionId);
  if (ownerKey) {
    notifyOwner(ownerKey, 'file:downloaded', {
      fileId: file.id,
      filename: file.filename,
      downloadedAt: new Date().toISOString(),
      newDownloadCount: file.downloadCount + 1,
    });
  }

  // Check file exists on disk
  const fileExists = await storage.exists(file.filePath);
  if (!fileExists) {
    return c.json({ error: 'File data not found' }, 404);
  }

  const fileSize = await storage.getFileSize(file.filePath);
  const readStream = storage.read(file.filePath);

  // Encode filename for Content-Disposition header
  const encodedFilename = encodeURIComponent(file.filename);

  c.header('Content-Type', file.mimeType);
  c.header('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
  c.header('Content-Length', String(fileSize));

  return stream(c, async (s) => {
    for await (const chunk of readStream) {
      await s.write(chunk);
    }
  });
});

export default download;
