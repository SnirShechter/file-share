import { pgTable, uuid, integer, char, varchar, bigint, timestamp, inet, check, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalId: integer('internal_id').notNull().default(sql`nextval('file_code_seq')`),

  // Generated column - computed by database, read-only in application
  code: char('code', { length: 6 }).generatedAlwaysAs(
    sql`lpad(((internal_id * 512927) % 1000000)::text, 6, '0')`
  ),

  filename: varchar('filename', { length: 512 }).notNull(),
  filePath: varchar('file_path', { length: 1024 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull().default('application/octet-stream'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  userId: varchar('user_id', { length: 255 }),
  sessionId: varchar('session_id', { length: 36 }),
  downloadCount: integer('download_count').notNull().default(0),
}, (table) => ({
  ownerCheck: check('owner_check', sql`${table.userId} IS NOT NULL OR ${table.sessionId} IS NOT NULL`),
  sessionIdx: index('idx_files_session_id').on(table.sessionId).where(sql`session_id IS NOT NULL`),
  userIdx: index('idx_files_user_id').on(table.userId).where(sql`user_id IS NOT NULL`),
  expiresIdx: index('idx_files_expires_at').on(table.expiresAt),
  internalIdx: index('idx_files_internal_id').on(table.internalId),
}));

export const downloads = pgTable('downloads', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  downloadedAt: timestamp('downloaded_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: inet('ip_address'),
}, (table) => ({
  fileIdx: index('idx_downloads_file_id').on(table.fileId),
}));

export const filesRelations = relations(files, ({ many }) => ({
  downloads: many(downloads),
}));

export const downloadsRelations = relations(downloads, ({ one }) => ({
  file: one(files, {
    fields: [downloads.fileId],
    references: [files.id],
  }),
}));
