import { client } from './connection.js';

export async function runMigrations() {
  console.log('Running database migrations...');

  // Create the cyclic sequence for bijective code generation
  await client`
    CREATE SEQUENCE IF NOT EXISTS file_code_seq
      START 1
      INCREMENT 1
      MINVALUE 1
      MAXVALUE 999999
      CYCLE
  `;

  // Create files table with generated code column
  await client`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      internal_id INT NOT NULL DEFAULT nextval('file_code_seq'),
      code CHAR(6) GENERATED ALWAYS AS (
        lpad(((internal_id * 512927) % 1000000)::text, 6, '0')
      ) STORED,
      filename VARCHAR(512) NOT NULL,
      file_path VARCHAR(1024) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      user_id VARCHAR(255),
      session_id VARCHAR(36),
      download_count INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
    )
  `;

  // Create indexes (IF NOT EXISTS is implicit for CREATE INDEX IF NOT EXISTS)
  await client`CREATE UNIQUE INDEX IF NOT EXISTS idx_files_code ON files(code)`;
  await client`CREATE INDEX IF NOT EXISTS idx_files_internal_id ON files(internal_id)`;
  await client`CREATE INDEX IF NOT EXISTS idx_files_session_id ON files(session_id) WHERE session_id IS NOT NULL`;
  await client`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id) WHERE user_id IS NOT NULL`;
  await client`CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at)`;

  // Create downloads table
  await client`
    CREATE TABLE IF NOT EXISTS downloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address INET
    )
  `;

  await client`CREATE INDEX IF NOT EXISTS idx_downloads_file_id ON downloads(file_id)`;

  console.log('Database migrations completed.');
}
