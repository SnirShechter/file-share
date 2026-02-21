import { lt } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { files } from '../db/schema.js';
import * as storage from './file-storage.js';
import { eq } from 'drizzle-orm';

export async function cleanupExpiredFiles() {
  console.log('Starting cleanup of expired files...');

  const expiredFiles = await db
    .select({ id: files.id, filePath: files.filePath, filename: files.filename })
    .from(files)
    .where(lt(files.expiresAt, new Date()));

  let deletedCount = 0;

  for (const file of expiredFiles) {
    try {
      await storage.remove(file.filePath);
    } catch (err) {
      console.error(`Failed to delete file ${file.filePath}:`, err);
    }

    await db.delete(files).where(eq(files.id, file.id));
    deletedCount++;
  }

  console.log(`Cleanup: deleted ${deletedCount} expired files`);
}
