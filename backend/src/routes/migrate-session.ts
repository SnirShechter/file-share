import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { files } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const migrateSession = new Hono();

migrateSession.post('/migrate-session', requireAuth, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const { sessionId } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return c.json({ error: 'Missing or invalid sessionId' }, 400);
  }

  const result = await db
    .update(files)
    .set({ userId, sessionId: null })
    .where(eq(files.sessionId, sessionId))
    .returning({ id: files.id });

  return c.json({ migrated: result.length });
});

export default migrateSession;
