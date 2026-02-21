import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { files } from '../db/schema.js';
import * as storage from '../services/file-storage.js';
import { optionalAuth } from '../middleware/auth.js';
import { MAX_FILE_SIZE, FILE_EXPIRY_MS } from '../utils/constants.js';
import { lookup } from 'mime-types';
import type { AppEnv } from '../types.js';

const upload = new Hono<AppEnv>();

upload.post('/upload', optionalAuth, async (c) => {
  const userId = c.get('userId') as string | undefined;
  const sessionId = c.req.header('X-Session-Id');

  if (!userId && !sessionId) {
    return c.json({ error: 'Authentication or session ID required' }, 400);
  }

  const body = await c.req.parseBody();
  const file = body['file'];

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE} bytes` }, 413);
  }

  const fileId = crypto.randomUUID();
  const mimeType = lookup(file.name) || file.type || 'application/octet-stream';

  const arrayBuffer = await file.arrayBuffer();
  const filePath = await storage.save(fileId, file.name, arrayBuffer);

  const expiresAt = new Date(Date.now() + FILE_EXPIRY_MS);

  const [newFile] = await db.insert(files).values({
    filename: file.name,
    filePath,
    fileSize: file.size,
    mimeType,
    expiresAt,
    userId: userId || null,
    sessionId: userId ? null : sessionId || null,
  }).returning();

  return c.json({
    id: newFile.id,
    code: newFile.code,
    filename: newFile.filename,
    fileSize: newFile.fileSize,
    mimeType: newFile.mimeType,
    uploadedAt: newFile.uploadedAt?.toISOString(),
    expiresAt: newFile.expiresAt.toISOString(),
  }, 201);
});

export default upload;
